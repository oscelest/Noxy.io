import ProgressHandler from "../../common/classes/ProgressHandler";
import HTTPMethod from "../../common/enums/HTTPMethod";
import HTTPStatusCode from "../../common/enums/HTTPStatusCode";
import ServerException from "../../common/exceptions/ServerException";

export default class Fetch<T = unknown> {

  public readonly path: URL;
  public readonly method: HTTPMethod;
  public readonly data: Collection<(Blob | string)[]>;
  
  constructor(method: HTTPMethod, path: string, data: Collection<Many<FetchDataType> | FileList> = {}) {
    this.method = method;
    this.data = {};
    this.path = new URL(path, `${location.protocol}//api.${location.hostname}`);
    this.appendData(data);
  }
  
  public appendData(data: Collection<Many<FetchDataType> | FileList>) {
    for (let key in data) this.append(key, data[key]);
  }
  
  public append(key: string, item: Many<FetchDataType> | FileList) {
    if (item === undefined || item === null) return;
    if (this.data[key] === undefined) this.data[key] = [];
    
    if (Array.isArray(item) || item instanceof FileList) {
      for (let i = 0; i < item.length; i++) this.append(key, item[i]);
      return;
    }
    else {
      if (item instanceof Date) {
        return this.data[key].push(item.toISOString());
      }
      if (typeof item === "number") {
        return this.data[key].push(item.toString());
      }
      if (typeof item === "boolean") {
        return this.data[key].push(item ? "1" : "0");
      }
      if (typeof item === "object") {
        return this.data[key].push(JSON.stringify(item));
      }
      return this.data[key].push(item);
    }
  }
  
  public async execute(progress?: ProgressHandler) {
    return new Promise<APIResponse<T>>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.addEventListener("readystatechange", (event) => {
        console.log("State change", event);
        if (progress?.cancelled) return request.abort();
        if (request.readyState === XMLHttpRequest.DONE) {
          if (request.status !== 200) {
            return reject(new ServerException(request.status as keyof typeof HTTPStatusCode, Fetch.parseResponse(request.response, request.responseType)))
          }
          if (request.status === 200) {
            return resolve(Fetch.parseResponse(request.response, request.responseType));
          }
        }
      });
      
      request.addEventListener("progress", (event) => {
        if (progress?.cancelled) return request.abort();
        if (progress?.progress_handler) progress?.progress_handler(event);
      });
      
      request.addEventListener("error", (event) => {
        console.log("Error", event);
        reject(new Error("Failed!"));
      });
      
      request.addEventListener("timeout", (event) => {
        console.log("Timeout", event);
        reject(new Error("Timeout!"));
      });
      
      request.addEventListener("abort", (event) => {
        console.log("Abort", event);
        reject(new Error("Aborted!"));
      });

      if (this.method === HTTPMethod.GET) {
        request.open(this.method, `${this.path}?${this.toURLSearchParameter()}`);
        request.send();
      }
      else {
        request.open(this.method, this.path);
        if (this.hasFile()){
          request.send(this.toFormData());
        }
        else {
          request.setRequestHeader("Content-Type", "application/json")
          request.send(this.toJSON());
        }
      }
    });
  }

  private hasFile() {
    for (let key in this.data) {
      for (let i = 0; i < this.data[key].length; i++) {
        if (this.data[key][i] instanceof File) return true;
      }
    }
    return false;
  }

  private toURLSearchParameter() {
    const data = new URLSearchParams();
    for (let key in this.data) {
      for (let i = 0; i < this.data[key].length; i++) {
        if (typeof this.data[key][i] !== "string") continue;
        data.append(key, this.data[key][i] as string);
      }
    }
    return data;
  }
  
  private toFormData() {
    const data = new FormData();
    for (let key in this.data) {
      for (let i = 0; i < this.data[key].length; i++) {
        data.append(key, this.data[key][i]);
      }
    }
    return data;
  }

  private toJSON() {
    const data = {} as Collection<Many<FetchDataType>>;
    for (let key in this.data) {
      if (!this.data[key].length) continue;
      data[key] = this.data[key].length === 1 ? this.data[key][0] : this.data[key];
    }
    return JSON.stringify(data);
  }
  
  public static async get<T>(path: string, data?: FetchData, progress?: ProgressHandler) {
    return await new this<T>(HTTPMethod.GET, path, data).execute(progress);
  }
  
  public static async post<T>(path: string, data?: FetchData, progress?: ProgressHandler) {
    return await new this<T>(HTTPMethod.POST, path, data).execute(progress);
  }
  
  public static async put<T>(path: string, data?: FetchData, progress?: ProgressHandler) {
    return await new this<T>(HTTPMethod.PUT, path, data).execute(progress);
  }
  
  public static async delete<T>(path: string, data?: FetchData, progress?: ProgressHandler) {
    return await new this<T>(HTTPMethod.DELETE, path, data).execute(progress);
  }
  
  private static parseResponse(response: any, type: XMLHttpRequestResponseType) {
    try {
      if (type === "json" || typeof response === "string") {
        return JSON.parse(response);
      }
      return response;
    }
    catch (error) {
      return response.toString();
    }
  }
}

export interface FetchData {
  [key: string]: FetchDataType;
}

export type FetchDataType = File | undefined | null | boolean | number | string | object | Date;
