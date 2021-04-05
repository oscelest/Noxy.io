import BodyParser from "body-parser";
import Express from "express";
import * as FS from "fs";
import HTTP from "http";
import JSONWebToken from "jsonwebtoken";
import _ from "lodash";
import MethodOverride from "method-override";
import Multer from "multer";
import Path from "path";
import ServeFavicon from "serve-favicon";
import {v4} from "uuid";
import Alias from "../classes/Alias";
import APIKey from "../entities/APIKey";
import User from "../entities/User";
import PermissionLevel from "../enums/PermissionLevel";
import EndpointParameterType from "../enums/server/EndpointParameterType";
import HTTPMethod from "../enums/server/HTTPMethods";
import HTTPStatusCode from "../enums/server/HTTPStatusCode";
import ServerState from "../enums/server/ServerState";
import EndpointParameterException from "../exceptions/EndpointParameterException";
import ServerException from "../exceptions/ServerException";
import Logger, {LoggerLevels} from "./Logger";
import Validator from "./Validator";

if (!process.env.TMP_PATH) throw new Error("TMP_PATH environmental value must be defined.");

module Server {

  const port = process.env.NODE_PORT || 40491;
  const alias_collection: AliasCollection = {};
  const route_collection: EndpointCollection = {};

  let state: ServerState = ServerState.DEAD;
  let instance: HTTP.Server;
  let application = Express();


  export function bindRoute(alias: Alias, method: HTTPMethod, path: string | string[], options: EndpointOptions, cb: Express.RequestHandler) {
    path = _.concat(options.prefix ?? [], path);
    if (!path.length) throw new Error("Path must contain at least one part.");
    if (!_.every(path, part => part.match(/^(?:\/?:?[a-z][a-z-_]*|\/)+$/))) throw new Error(`Path contains invalid parts.`);
    path = _.map(path, part => part.replace(/^([^/])/, "/$1"));

    const weights = _.map(path, part => part[0] === ":" ? -1 : (part[0] === "/" ? part.length - 1 : part.length));
    path = path.join("").replace(/\/{2,}/g, "/").replace(/(?<!^)\/$/g, "");

    const callback = async (request: Express.Request, response: Express.Response, next: Express.NextFunction) => {
      try {
        await cb(request, response, next);
      }
      catch (error) {
        request.locals.respond?.(error);
      }
    };

    const key = alias.toString();
    alias_collection[`${method}:${path}`] = alias;
    route_collection[key] = {...route_collection[key], path, method, options, callback, weights};
  }


  export function bindRouteParameter(alias: Alias, name: string, type: EndpointParameterType, conditions: ParameterConditions, options: EndpointParameterOptions) {
    const key = alias.toString();

    if (type === EndpointParameterType.FILE) {
      route_collection[key] = {...route_collection[key], upload: [...route_collection[key]?.upload ?? [], {name, maxCount: 1}]};
    }

    route_collection[key] = {...route_collection[key], parameter_list: {...route_collection[key]?.parameter_list, [name]: {type, conditions, options}}};
  }


  export async function start() {
    if (state === ServerState.INITIALIZING) throw new Error(`Server is already being initialized.`);
    if (state === ServerState.ALIVE) throw new Error(`Server has already been started.`);
    state = ServerState.INITIALIZING;

    application.set("query parser", "simple");
    application.use("/static", Express.static(Path.resolve(process.env.PATH_ROOT!, "static")));
    application.use(BodyParser.json());
    application.use(BodyParser.urlencoded({extended: true}));
    application.use(MethodOverride("X-HTTP-Method-Override"));
    application.use(ServeFavicon(Path.resolve(process.env.PATH_ROOT ?? "/", "favicon.ico")));
    application.use(attachHeaders);

    _.map(route_collection, ({path, method, callback}) => {
      if (!path || !method || !callback) return;
      application[method](path, attachLocals, attachAuthorization, attachFiles, attachParameters, callback);
    });

    application.use(attachNotFound);

    instance = HTTP.createServer(application).listen(port);
    state = ServerState.ALIVE;
    return Server;
  }


  function attachHeaders(request: Express.Request, response: Express.Response, next: Express.NextFunction) {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, JSONP");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Masquerade");
    response.header("Access-Control-Allow-Credentials", "true");
    response.header("X-Frame-Options", "DENY");

    next();
  }


  function attachLocals(request: Express.Request, response: Express.Response, next: Express.NextFunction) {
    request.locals = {};
    request.locals.id = v4();
    request.locals.method = request.method.toLowerCase() as HTTPMethod;
    request.locals.path = request.route.path as string;
    request.locals.alias = alias_collection[`${request.locals.method}:${request.locals.path}`];
    request.locals.endpoint = route_collection[request.locals.alias.toString()];
    request.locals.parameters = {};
    request.locals.time_created = new Date();
    request.locals.respond = respond.bind(request);

    next();
  }


  async function attachAuthorization(request: Express.Request, response: Express.Response, next: Express.NextFunction) {
    const authorization = request.get("Authorization");
    const masquerade = request.get("Masquerade");

    if (request.locals.endpoint?.options?.user !== false && !authorization) {
      return request.locals.respond?.(new ServerException(401, {authorization}, "Authorization header is required."));
    }

    if (authorization) {
      try {
        request.locals.api_key = await (await import("../entities/APIKey")).default.performSelect(JSONWebToken.verify(authorization, process.env.JWT_SECRET!) as string);
      }
      catch (error) {
        if (error instanceof JSONWebToken.TokenExpiredError) return request.locals.respond?.(new ServerException(401, {authorization}, "Authorization token has expired."));
        if (error instanceof JSONWebToken.JsonWebTokenError) return request.locals.respond?.(new ServerException(401, {authorization}, "Authorization token was malformed."));
        if (error instanceof ServerException && error.code === 404) return request.locals.respond?.(new ServerException(404, {authorization}, "Authorization failed - User doesn't exist."));
        return request.locals.respond?.(new ServerException(500, error));
      }
    }

    if (request.locals.endpoint?.options?.permission && !_.every(_.concat(request.locals.endpoint.options.permission), level => request.locals.api_key?.permission.hasPermission(level))) {
      return request.locals.respond?.(new ServerException(403, {authorization, permission: request.locals.endpoint.options.permission}));
    }

    if (masquerade) {
      if (!request.locals.api_key?.permission.user.masquerade) {
        return request.locals.respond?.(new ServerException(403, {authorization, masquerade}));
      }

      try {
        request.locals.user = await (await import("../entities/User")).default.performSelect(masquerade);
      }
      catch (error) {
        if (error instanceof ServerException && error.code === 404) return request.locals.respond?.(new ServerException(404, {authorization}, "Authorization failed - User doesn't exist."));
        return request.locals.respond?.(new ServerException(500, error));
      }
    }
    else {
      request.locals.user = request.locals.api_key?.user;
    }

    next();
  }


  function attachFiles(request: Express.Request, response: Express.Response, next: Express.NextFunction) {
    if (!request.locals.endpoint?.upload) return next();

    const middleware = Multer({
      dest:   process.env.TMP_PATH,
      limits: {
        fileSize: 5242880,
      },
    });

    middleware.fields(request.locals.endpoint.upload)(request, response, (error: Multer.MulterError | string) => {
      if (error && error instanceof Error) {
        if (error.code === "LIMIT_UNEXPECTED_FILE") {
          return response.locals.respond(new ServerException(400, {field: error.field}, "File count limit exceeded."));
        }
        return request.locals.respond?.(error);
      }
      next();
    });
  }


  function attachParameters({files, query, body, locals: {respond, method, parameters, endpoint}}: Express.Request, response: Express.Response, next: Express.NextFunction) {
    if (!endpoint) return respond?.(new ServerException(404)) ?? response.send(404);

    const error_collection = {} as {[key: string]: EndpointParameterException};
    const received_parameter_list = method === HTTPMethod.GET ? query : body;

    for (let name in endpoint.parameter_list) {
      try {
        if (!endpoint.parameter_list.hasOwnProperty(name)) continue;
        const {type, conditions, options: {flag_array, flag_optional}} = endpoint.parameter_list[name];

        if (type === EndpointParameterType.FILE) {
          if (!files?.[name].length && !flag_optional) {
            error_collection[name] = new EndpointParameterException(`'${name}' is a mandatory field.`);
          }
          else {
            parameters[name] = flag_array ? files?.[name] : _.first(files?.[name]);
          }
        }
        else {
          const received = received_parameter_list[name] as string | string[];

          if (received === undefined) {

            // Intentional split "if" statement - If received value is undefined, it should not go through the validator
            if (method === HTTPMethod.GET && flag_optional === false || method !== HTTPMethod.GET && flag_optional !== true) {
              error_collection[name] = new EndpointParameterException(`'${name}' is a mandatory field.`);
            }
          }
          else if (!flag_array && Array.isArray(received)) {
            error_collection[name] = new EndpointParameterException(`Field '${name}' does not accept multiple values.`, received);
          }
          else {
            parameters[name] = Validator.parseParameter(type, !flag_array || Array.isArray(received) ? received : [received], conditions);
          }
        }
      }
      catch (error) {
        error_collection[name] = error;
      }
    }

    _.size(error_collection) ? respond?.(new ServerException(400, error_collection)) : next();
  }


  function attachNotFound(request: Express.Request, response: Express.Response, next: Express.NextFunction) {
    if (_.includes(["GET", "POST", "PUT", "PATCH", "DELETE", "JSONP"], request.method)) {
      return respond.bind(request, new ServerException(404))();
    }
    next();
  }


  function respond(this: Express.Request<{[key: string]: string}, Server.Response>, value: any) {
    const time_started = this.locals?.time_created?.toISOString() ?? new Date().toISOString();
    const time_completed = new Date().toISOString();

    if (value instanceof ServerException) {

      if (value.code === 500) {
        Logger.log({level: LoggerLevels.ERROR, message: value.message, content: value.content, stack: value.stack});
        value.message = HTTPStatusCode[500];
        value.content = {};
      }
      this.res?.status(value.code).json({success: false, message: value.message, content: value.content, time_started, time_completed});
    }
    else if (value instanceof Error && !(value instanceof ServerException)) {
      this.res?.status(500).json({success: false, message: HTTPStatusCode[500], content: {}, time_started, time_completed});
      Logger.log({level: LoggerLevels.ERROR, message: value.message, stack: value.stack});
    }
    else {
      this.res?.status(200).json({success: true, message: HTTPStatusCode[200], content: value, time_started, time_completed});
    }

    if (this.locals.endpoint?.upload?.length) {
      for (let i = 0; i < this.locals.endpoint.upload.length ?? 0; i++) {
        const {name} = this.locals.endpoint.upload[i];
        const parameter: FileHandle[] = Array.isArray(this.locals.parameters[name]) ? this.locals.parameters[name] : [this.locals.parameters[name]];

        for (let i = 0; i < parameter.length; i++) {
          if (!parameter[i]) continue;
          FS.unlink(Path.resolve(parameter[i].path), error => {
            if (!error || error.code === "ENOENT") return;
            Logger.log({level: LoggerLevels.ERROR, message: error.message, stack: error.stack});
          });
        }
      }
    }
  }

  export interface Response {
    success: boolean
    message: string
    content: {}
    time_started: string
    time_completed: string
  }

  export interface Endpoint {
    path?: string
    method?: HTTPMethod
    weights?: number[]
    options?: EndpointOptions
    callback?: Express.RequestHandler
    upload?: Multer.Field[]
    parameter_list?: EndpointParameterCollection
  }

  export interface EndpointParameter {
    type: EndpointParameterType
    options: EndpointParameterOptions
    conditions: any
  }

  export interface EndpointOptions {
    user?: boolean
    prefix?: string | string[]
    permission?: PermissionLevel | PermissionLevel[]
  }

  export interface EndpointParameterOptions {
    flag_array?: boolean
    flag_optional?: boolean
  }

  export type ParameterConditions =
    DateParameterConditions
    | EnumParameterConditions
    | FloatParameterConditions
    | IntegerParameterConditions
    | OrderParameterConditions
    | StringParameterConditions
    | {}

  export type DateParameterConditions = {earliest?: Date; latest?: Date; timestamp?: boolean}
  export type EnumParameterConditions = {[key: string]: string | number}
  export type FloatParameterConditions = {min?: number; max?: number; min_decimals?: number; max_decimals?: number}
  export type IntegerParameterConditions = {min?: number; max?: number}
  export type OrderParameterConditions = string[]
  export type StringParameterConditions = {min_length?: number; max_length?: number; validator?: RegExp}

  export type AliasCollection = {[path: string]: Alias}
  export type EndpointCollection = {[alias: string]: Endpoint};
  export type EndpointParameterCollection = {[name: string]: EndpointParameter}
}

declare module "express-serve-static-core" {
  // noinspection JSUnusedGlobalSymbols
  interface Request<P, ResBody = any, ReqBody = any> {
    files?: {[key: string]: FileHandle[]}

    locals: {
      id?: string
      path?: string
      method?: HTTPMethod
      alias?: Alias
      endpoint?: Server.Endpoint
      user?: User
      api_key?: APIKey
      parameters?: ReqBody
      time_created?: Date
      respond?: (response: ResBody) => void | Promise<void>
    }
  }

}

export default Server;
