import Alias from "./classes/Alias";
import HTTPMethod from "./enums/HTTPMethod";
import Server from "./services/Server";

declare module "express-serve-static-core" {
  interface Request<P, ResBody = any, ReqBody = any> {
    locals: Locals<ResBody, ReqBody>;
  }
  
  interface Locals<ResBody = any, ReqBody = any> {
    id: string;
    path: string;
    method: HTTPMethod;
    alias: Alias;
    endpoint: Server.Endpoint;
    params: ReqBody;
    time_created: Date;
    respond: (response: ResBody) => void | Promise<void>;
  }
}

declare global {
  
  export type Collection<T> = {[key: string]: T}
  
  export type Many<A> = A | A[]
  
  export type LambdaFn<A = any, R = any> = (...args: A) => R;
  
  export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
  
  export type RecursiveArray<T> = (T | Recursive<T>)[]
  
  export type NonArray<T> = T extends Array<unknown> ? never : T
  
  export type Key<V> = (V extends (infer R)[] ? keyof R : keyof V) & string
  
  export type Properties<E> = { [K in keyof Pick<E, { [K in keyof E]: E[K] extends Function ? never : K }[keyof E]>]: E[K] }
  
  export type NonProperties<E> = { [K in keyof Pick<E, { [K in keyof E]: E[K] extends Function ? K : never }[keyof E]>]: E[K] }
  
  export type Initializer<E> = Writeable<Partial<Properties<E>>>
  
  export type Writeable<T> = { -readonly [K in keyof T]: T[K] }
  
  export type DecoratorConstructor = {new(...args: any[]): any}
  
  export type HierarchyArray<V = any> = (V | HierarchyArray<V>)[]
  
  export type DeepArray<V = any> = V[] | DeepArray<V>[]
  
  export type Unwrap<V> = V extends (infer R)[] ? R : V extends {[key: string]: infer R} ? R : V
  
  export type Simplify<O> = (O extends object ? Properties<O> : O)
  
  export type JSONObject = null | boolean | number | string | JSONObject[] | {[prop: string]: JSONObject}
  
  export type HTMLTag = keyof HTMLElementTagNameMap
  
  export type PageProps = {permission?: string | null}
  
  export interface APIResponse<T> {
    success: boolean;
    message: string;
    content: T extends Array<infer R> ? Simplify<R>[] : Simplify<T>;
    time_started: Date;
    time_completed: Date;
    time_elapsed: Date;
  }
  
  export interface RequestErrorQuery {
    [key: string]: {
      message: string
      received?: string
    };
  }
  
  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
  }
}
