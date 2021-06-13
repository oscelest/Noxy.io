import {MikroORM, EntityManager} from "@mikro-orm/core";
import DBConfig from "../../api.noxy.io/mikro-orm.config";

if (!process.env.DB_HOST) throw new Error("DB_HOST environmental value must be defined.");
if (!process.env.DB_PORT) throw new Error("DB_PORT environmental value must be defined.");
if (!process.env.DB_USERNAME) throw new Error("DB_USERNAME environmental value must be defined.");
if (!process.env.DB_PASSWORD) throw new Error("DB_PASSWORD environmental value must be defined.");
if (!process.env.DB_DATABASE) throw new Error("DB_DATABASE environmental value must be defined.");

module Database {

  export let instance: MikroORM;
  export let manager: EntityManager;

  export async function connect() {
    const instance = await MikroORM.init(DBConfig);
    Database.instance = instance;
    Database.manager = instance.em;

    return instance;
  }

}

export default Database;
