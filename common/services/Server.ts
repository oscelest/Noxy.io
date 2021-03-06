import BodyParser from "body-parser";
import Express from "express";
import * as core from "express-serve-static-core";
import {Locals} from "express-serve-static-core";
import * as FS from "fs";
import HTTP from "http";
import _ from "lodash";
import MethodOverride from "method-override";
import Multer from "multer";
import Path from "path";
import ServeFavicon from "serve-favicon";
import {v4} from "uuid";
import Alias from "../classes/Alias";
import HTTPMethod from "../enums/HTTPMethod";
import HTTPStatusCode from "../enums/HTTPStatusCode";
import PermissionLevel from "../enums/PermissionLevel";
import ValidatorType from "../enums/ValidatorType";
import ServerException from "../exceptions/ServerException";
import ValidatorException from "../exceptions/ValidatorException";
import Logger from "./Logger";
import Validator from "./Validator";
import FileHandle from "../classes/File/FileHandle";

if (!process.env.PORT) throw new Error("PORT environmental value must be defined.");
if (!process.env.TMP_PATH) throw new Error("TMP_PATH environmental value must be defined.");

module Server {

  const port = process.env.PORT || 80;
  const alias_collection: AliasCollection = {};
  const route_collection: EndpointCollection = {};
  const middleware_collection: Express.RequestHandler[] = [];

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


  export function bindRouteParameter(alias: Alias, name: string, type: ValidatorType, conditions: Validator.ParameterConditions, options: EndpointParameterOptions) {
    const key = alias.toString();

    if (type === ValidatorType.FILE) {
      route_collection[key] = {...route_collection[key], upload: [...route_collection[key]?.upload ?? [], {name, maxCount: 1}]};
    }

    route_collection[key] = {...route_collection[key], parameter_list: {...route_collection[key]?.parameter_list, [name]: {type, conditions, options}}};
  }


  export function bindMiddleware(middleware: Express.RequestHandler) {
    middleware_collection.push(middleware);
  }


  export async function start() {
    const application = Express();

    application.set("query parser", "simple");
    application.use("/static", Express.static(Path.resolve(process.env.PATH_ROOT!, "static")));
    application.use(BodyParser.json());
    application.use(BodyParser.urlencoded({extended: true}));
    application.use(MethodOverride("X-HTTP-Method-Override"));
    application.use(ServeFavicon(Path.resolve(process.env.PATH_ROOT ?? "/", "favicon.ico")));
    application.use(attachHeaders);

    _.map(route_collection, ({path, method, callback}) => {
      if (!path || !method || !callback) return;
      application[method](path, attachLocals, attachFiles, attachParameters, ...middleware_collection, callback);
    });

    application.use(attachNotFound);

    HTTP.createServer(application).listen(port);
  }


  function attachHeaders(request: Express.Request, response: Express.Response, next: Express.NextFunction) {
    request.locals = {} as Locals<{}, {}>;
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, JSONP");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Masquerade");
    response.header("Access-Control-Allow-Credentials", "true");
    response.header("X-Frame-Options", "DENY");

    next();
  }

  function attachNotFound(request: Express.Request, response: Express.Response, next: Express.NextFunction) {
    if (_.includes(["GET", "POST", "PUT", "PATCH", "DELETE", "JSONP"], request.method)) {
      return respond.bind(request, new ServerException(404))();
    }
    next();
  }

  function attachLocals(request: Express.Request, response: Express.Response, next: Express.NextFunction) {
    request.locals.id = v4();
    request.locals.method = request.method.toLowerCase() as HTTPMethod;
    request.locals.path = request.route.path as string;
    request.locals.alias = alias_collection[`${request.locals.method}:${request.locals.path}`];
    request.locals.endpoint = route_collection[request.locals.alias.toString()];
    request.locals.params = {};
    request.locals.time_created = new Date();
    request.locals.respond = respond.bind(request);

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
          return request.locals.respond(new ServerException(400, {field: error.field}, "File count limit exceeded."));
        }
        return request.locals.respond(error);
      }
      next();
    });
  }


  function attachParameters({files, query, body, locals: {respond, method, params, endpoint}}: Express.Request, response: Express.Response, next: Express.NextFunction) {
    if (!endpoint) return respond?.(new ServerException(404)) ?? response.send(404);

    const error_collection = {} as {[key: string]: ValidatorException};
    const received_parameter_list = method === HTTPMethod.GET ? query : body;
    const file_collection = _.reduce(
      files,
      (result, file, key) => _.set(result, key, Array.isArray(file) ? _.map(file, value => new FileHandle(value)) : [new FileHandle(file as File)]),
      {} as {[key: string]: FileHandle[]},
    );

    for (let name in endpoint.parameter_list) {
      try {
        if (!endpoint.parameter_list.hasOwnProperty(name)) continue;
        const {type, conditions, options: {array, optional}} = endpoint.parameter_list[name];

        if (type === ValidatorType.FILE) {
          if (!file_collection?.[name].length && !optional) {
            error_collection[name] = new ValidatorException(`'${name}' is a mandatory field.`);
          }
          else {
            params[name] = array ? file_collection?.[name] : _.first(file_collection?.[name]);
          }
        }
        else {
          const received = received_parameter_list[name] as string | string[];

          if (received === undefined || received === "") {
            // Intentional split "if" statement - If received value is undefined, it should not go through the validator
            if (method === HTTPMethod.GET && optional === false || method !== HTTPMethod.GET && optional !== true) {
              error_collection[name] = new ValidatorException(`'${name}' is a mandatory field.`);
            }
          }
          else if (!array && Array.isArray(received)) {
            error_collection[name] = new ValidatorException(`Field '${name}' does not accept multiple values.`, received);
          }
          else {
            params[name] = Validator.parseParameter(type, !array || Array.isArray(received) ? received : [received], conditions);
          }
        }
      }
      catch (error) {
        error_collection[name] = error;
      }
    }

    _.size(error_collection) ? respond?.(new ServerException(400, error_collection)) : next();
  }

  function respond<T>(this: Express.Request<{[key: string]: string}, Server.ResponseBody<T>>, value: T) {
    const time_started = this.locals.time_created?.toISOString() ?? new Date().toISOString();
    const time_completed = new Date().toISOString();

    let code: number;
    const response = {time_started, time_completed} as ResponseBody<T>;

    if (value instanceof ServerException && value.code !== 500) {
      code = value.code;
      if (code === 404) value.content.params = _.reduce(this.locals.params, (result, value, key) => value instanceof FileHandle ? {...result, ...value.toJSON()} : {...result, [key]: value}, {});
      Object.assign(response, {success: false, message: value.message, content: value.content} as ResponseBody);
    }
    else if (value instanceof Error) {
      code = 500;
      Object.assign(response, {success: false, message: HTTPStatusCode[500], content: {} as T} as ResponseBody);

      const {name, message, stack, ...error} = value;
      Logger.write(Logger.Level.ERROR, {name, message, ...error, stack});
    }
    else {
      code = 200;
      Object.assign(response, {success: true, message: HTTPStatusCode[200], content: value} as ResponseBody);
    }

    this.res?.status(code).json(response);

    if (this.locals.endpoint?.upload?.length) {
      for (let i = 0; i < this.locals.endpoint.upload.length ?? 0; i++) {
        const {name} = this.locals.endpoint.upload[i];
        const parameter: FileHandle[] = Array.isArray(this.locals.params[name]) ? this.locals.params[name] : [this.locals.params[name]];

        for (let i = 0; i < parameter.length; i++) {
          if (!parameter[i]) continue;
          FS.unlink(Path.resolve(parameter[i].path), error => {
            if (!error || error.code === "ENOENT") return;
            Logger.write(Logger.Level.ERROR, error);
          });
        }
      }
    }
  }

  export interface Request<P = core.ParamsDictionary, Res = any, ReqB = any, ReqQ = core.Query, L extends Record<string, any> = Record<string, any>> extends Express.Request<P, Res, ReqB, ReqQ, L> {}

  export interface Response<ResBody = any, Locals extends Record<string, any> = Record<string, any>> extends Express.Response<ResBody, Locals> {}

  export interface ResponseBody<T = any> {
    success: boolean
    message: string
    content: T
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
    type: ValidatorType
    options: EndpointParameterOptions
    conditions: any
  }

  export interface EndpointOptions {
    user?: boolean
    prefix?: string | string[]
    permission?: PermissionLevel | PermissionLevel[]
  }

  export interface EndpointParameterOptions {
    array?: boolean
    optional?: boolean
  }

  export type AliasCollection = {[path: string]: Alias}
  export type EndpointCollection = {[alias: string]: Endpoint};
  export type EndpointParameterCollection = {[name: string]: EndpointParameter}
}


export default Server;
