import Alias from "./classes/Alias";
import HTTPMethod from "./enums/HTTPMethod";
import Server from "./services/Server";

declare module "express-serve-static-core" {
  interface Request<P, ResBody = any, ReqBody = any> {
    locals: Locals<ResBody, ReqBody>
  }

  interface Locals<ResBody = any, ReqBody = any> {
    id: string
    path: string
    method: HTTPMethod
    alias: Alias
    endpoint: Server.Endpoint
    params: ReqBody
    time_created: Date
    respond: (response: ResBody) => void | Promise<void>
  }
}


declare global {

  export type Key<V> = (V extends (infer R)[] ? keyof R : keyof V) & string

  export type Properties<E> = { [K in keyof Pick<E, { [K in keyof E]: E[K] extends Function ? never : K }[keyof E]>]: E[K] };

  export type Initializer<E> = Partial<Properties<E>>

  export type DecoratorConstructor = {new(...args: any[]): any}

  export interface APIRequest<T> {
    success: boolean
    message: string
    content: T extends (infer R)[] ? Simplify<R>[] : Simplify<T>
    time_started: Date
    time_completed: Date
    time_elapsed: Date
  }

  export interface RequestErrorQuery {
    [key: string]: {
      message: string
      received?: string
    }
  }

  export interface RequestPagination<O extends {}> {
    skip: number
    limit: number
    order: RequestPaginationOrder<O>
  }

  export type DeepArray<V> = V | DeepArray<V>[]

  export type Unwrap<V> = V extends (infer R)[] ? R : V extends {[key: string]: infer R} ? R : V;

  export type Simplify<O> = (O extends object ? Properties<O> : O)

  export type RequestPaginationOrder<O extends {}> = { [K in keyof Pick<O, { [K in keyof O]: O[K] extends Function ? never : K }[keyof O]>]?: "ASC" | "DESC" }

  export type PageProps = {permission?: string | null}

  export type JSONObject = null | boolean | number | string | JSONObject[] | { [prop: string]: JSONObject }

  export interface File {
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
