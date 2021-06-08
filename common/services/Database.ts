import {MikroORM, EntityManager} from "@mikro-orm/core";
import NamingStrategy from "../classes/NamingStrategy";

if (!process.env.DB_HOST) throw new Error("DB_HOST environmental value must be defined.");
if (!process.env.DB_PORT) throw new Error("DB_PORT environmental value must be defined.");
if (!process.env.DB_USERNAME) throw new Error("DB_USERNAME environmental value must be defined.");
if (!process.env.DB_PASSWORD) throw new Error("DB_PASSWORD environmental value must be defined.");
if (!process.env.DB_DATABASE) throw new Error("DB_DATABASE environmental value must be defined.");

module Database {

  export let instance: MikroORM;
  export let manager: EntityManager;

  export async function connect() {
    const instance = await MikroORM.init({
      entities:       ["./entities/**"],
      type:           "mysql",
      host:           process.env.DB_HOST,
      port:           Number(process.env.DB_PORT),
      user:           process.env.DB_USERNAME,
      password:       process.env.DB_PASSWORD,
      dbName:         process.env.DB_DATABASE,
      namingStrategy: NamingStrategy,
    });

    Database.instance = instance;
    Database.manager = instance.em;

    return instance;
  }

}

export default Database;
