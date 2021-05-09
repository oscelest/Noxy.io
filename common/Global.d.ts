import Alias from "./classes/Alias";
import HTTPMethod from "./enums/HTTPMethod";
import Server from "./services/Server";



declare module "express-serve-static-core" {
  interface Request<P, ResBody = any, ReqBody = any> {
    locals: Locals<ResBody, ReqBody>
  }

  interface Locals<ResBody = any, ReqBody = any> {
    id?: string
    path?: string
    method?: HTTPMethod
    alias?: Alias
    endpoint?: Server.Endpoint
    parameters?: ReqBody
    time_created?: Date
    respond?: (response: ResBody) => void | Promise<void>
  }
}

declare global {

  export type Key<V> = (V extends (infer R)[] ? keyof R : keyof V) & string

  export type Properties<E> = { [K in keyof Pick<E, { [K in keyof E]: E[K] extends Function ? never : K }[keyof E]>]: E[K] };

  export type Constructor = {new(...args: any[]): any}

  export interface FileHandle extends File {
    fieldname: string
    originalname: string
    encoding: string
    mimetype: string
    destination: string
    filename: string
    path: string
    size: number
  }

}
