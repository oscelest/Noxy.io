/// <reference types="next" />
/// <reference types="next/types/global" />

declare type RecursiveObject<V> = V | {[key: string]: V}

declare interface APIRequest<T> {
  success: boolean
  message: string
  content: T extends (infer R)[] ? Simplify<R>[] : Simplify<T>
  time_started: Date
  time_completed: Date
  time_elapsed: Date
}

declare interface RequestErrorQuery {
  [key: string]: {
    message: string
    received?: string
  }
}

declare interface RequestPagination<O extends {}> {
  skip: number
  limit: number
  order: RequestPaginationOrder<O>
}

declare type Unwrap<V> = V extends (infer R)[] ? R : V extends {[key: string]: infer R} ? R : V;

declare type Simplify<O> = (O extends object ? Properties<O> : O)

declare type Properties<O> = { [K in keyof Pick<O, { [K in keyof O]: O[K] extends Function ? never : K }[keyof O]>]: O[K] };

declare type EntityInitializer<O> = Partial<Properties<O>>

declare type RequestPaginationOrder<O extends {}> = { [K in keyof Pick<O, { [K in keyof O]: O[K] extends Function ? never : K }[keyof O]>]?: "ASC" | "DESC" }

declare type PageProps = {permission?: string | null}
