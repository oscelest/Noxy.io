/// <reference path="../common/Global.d.ts" />

require("dotenv").config();
import * as FS from "fs";
import JSONWebToken from "jsonwebtoken";
import _ from "lodash";
import Path from "path";
import * as TypeORM from "typeorm";
import Alias from "../common/classes/Alias";
import HTTPMethod from "../common/enums/HTTPMethod";
import PermissionLevel from "../common/enums/PermissionLevel";
import ServerException from "../common/exceptions/ServerException";
import Logger from "../common/services/Logger";
import Server from "../common/services/Server";
import APIKey from "./entities/APIKey";
import User from "./entities/User";

(async () => {
  if (!process.env.TMP_PATH) throw new Error("TMP_PATH environmental value must be defined.");
  if (!process.env.LOG_PATH) throw new Error("LOG_PATH environmental value must be defined.");
  if (!process.env.FILE_PATH) throw new Error("FILE_PATH environmental value must be defined.");

  if (!process.env.SERVICE) throw new Error("SERVICE environmental value must be defined.");
  if (!process.env.DOMAIN) throw new Error("DOMAIN environmental value must be defined.");

  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environmental value must be defined.");

  try {
    process.env.PATH_ROOT = Path.resolve(__dirname);
    FS.mkdir(process.env.TMP_PATH, _.noop);
    FS.mkdir(process.env.FILE_PATH, _.noop);

    Logger.write(Logger.Level.INFO, "Server starting!");

    await TypeORM.createConnection({
      type:        "mysql",
      host:        process.env.DB_HOST,
      port:        +(process.env.DB_PORT || 0),
      username:    process.env.DB_USERNAME,
      password:    process.env.DB_PASSWORD,
      database:    process.env.DB_DATABASE,
      synchronize: process.env.NODE_ENV !== "production",
      // logging:     process.env.NODE_ENV === "production" ? [] : ["error"],
      entities: [
        Path.resolve(__dirname, "entities", "**/*.ts"),
      ],
    });

    Server.bindRoute(new Alias(), HTTPMethod.GET, "/", {}, async ({locals: {respond}}) => {
      setTimeout(() => respond?.({}), Math.ceil(Math.random() * 95) + 5);
    });

    Server.bindMiddleware(async (request: Server.Request, response: any, next: Function) => {
        const authorization = request.get("Authorization");
        const masquerade = request.get("Masquerade");

        if (request.locals.endpoint?.options?.user !== false && !authorization) {
          return request.locals.respond?.(new ServerException(401, {authorization}, "Authorization header is required."));
        }

        if (authorization) {
          try {
            request.locals.api_key = await APIKey.performSelect(JSONWebToken.verify(authorization, process.env.JWT_SECRET!) as string);
          }
          catch (error) {
            if (error instanceof JSONWebToken.TokenExpiredError) return request.locals.respond?.(new ServerException(401, {authorization}, "Authorization token has expired."));
            if (error instanceof JSONWebToken.JsonWebTokenError) return request.locals.respond?.(new ServerException(401, {authorization}, "Authorization token was malformed."));
            if (error instanceof ServerException && error.code === 404) return request.locals.respond?.(new ServerException(404, {authorization}, "Authorization failed - User doesn't exist."));
            return request.locals.respond?.(new ServerException(500, error));
          }
        }

        if (request.locals.endpoint?.options?.permission && !_.every(_.concat(request.locals.endpoint.options.permission), level => request.locals.api_key?.permission[level])) {
          return request.locals.respond?.(new ServerException(403, {authorization, permission: request.locals.endpoint.options.permission}));
        }

        if (masquerade) {
          if (!request.locals.api_key?.permission[PermissionLevel.USER_MASQUERADE]) {
            return request.locals.respond?.(new ServerException(403, {authorization, masquerade}));
          }

          try {
            request.locals.user = await User.performSelect(masquerade);
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
      },
    );

    await Server.start();

    Logger.write(Logger.Level.INFO, "Server started!");
  }
  catch ({message, stack}) {
    console.log(message, stack);
    Logger.write(Logger.Level.ERROR, {message, stack});
    process.exit(0);
  }
})();

declare module "express-serve-static-core" {
  interface Locals<ResBody = any, ReqBody = any> {
    api_key?: APIKey
    user?: User
  }
}
