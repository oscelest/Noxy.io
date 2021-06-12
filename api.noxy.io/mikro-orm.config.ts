import NamingStrategy from "../common/classes/NamingStrategy";
import {Options} from "@mikro-orm/core";

const DBConfig: Options = {
  entities:       ["./entities/**"],
  type:           "mysql",
  host:           process.env.DB_HOST,
  port:           Number(process.env.DB_PORT),
  user:           process.env.DB_USERNAME,
  password:       process.env.DB_PASSWORD,
  dbName:         process.env.DB_DATABASE,
  namingStrategy: NamingStrategy,
};

export default DBConfig;
