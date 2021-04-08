require("dotenv").config();
import * as FS from "fs";
import _ from "lodash";
import Path from "path";
import * as TypeORM from "typeorm";
import Alias from "../common/classes/Alias";
import HTTPMethod from "../common/enums/HTTPMethod";
import Logger from "../common/services/Logger";
import Server from "./services/Server";

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
    FS.mkdir(process.env.LOG_PATH, _.noop);
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

    await Server.start();

    Logger.write(Logger.Level.INFO, "Server started!");
  }
  catch ({message, stack}) {
    console.log(message, stack)
    Logger.write(Logger.Level.ERROR, {message, stack});
    process.exit(0);
  }
})();

declare global {

  export type Key<V> = (V extends (infer R)[] ? keyof R : keyof V) & string

  export type Properties<E> = { [K in keyof Pick<E, { [K in keyof E]: E[K] extends Function ? never : K }[keyof E]>]: E[K] };

  export type Constructor = {new(...args: any[]): any}

}
