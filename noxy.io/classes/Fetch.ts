import ProgressHandler from "../../common/classes/ProgressHandler";
import HTTPMethod from "../../common/enums/HTTPMethod";

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
  
  public append(key: string, item?: Many<FetchDataType> | FileList) {
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
      return this.data[key].push(key, item);
    }
  }
  
  public async execute(progress?: ProgressHandler) {
    return new Promise<APIResponse<T>>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.addEventListener("readystatechange", (event) => {
        console.log(event);
        if (progress?.cancelled) return request.abort();
        if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
          try {
            if (request.responseType === "json") {
              return resolve(JSON.parse(request.response));
            }
            return resolve(request.response);
          }
          catch (error) {
            return request.response.toString();
          }
        }
      });
      
      request.addEventListener("progress", (event) => {
        if (progress?.cancelled) return request.abort();
        if (progress?.progress_handler) progress?.progress_handler(event);
      });
      
      request.addEventListener("error", (event) => {
        console.log(event);
        reject(new Error("Failed!"));
      });
      
      request.addEventListener("timeout", (event) => {
        console.log(event);
        reject(new Error("Timeout!"));
      });
      
      request.addEventListener("abort", (event) => {
        console.log(event);
        reject(new Error("Aborted!"));
      });
      
      if (this.method === HTTPMethod.GET) {
        request.open(this.method, `${this.path}?${this.getURLSearchParameter()}`);
        request.send();
      }
      else {
        request.open(this.method, this.path);
        request.send(this.getFormData());
      }
    });
  }
  
  private getURLSearchParameter() {
    const data = new URLSearchParams();
    for (let key in this.data) {
      for (let i = 0; i < this.data[key].length; i++) {
        if (typeof this.data[key][i] !== "string") continue;
        data.append(key, this.data[key][i] as string);
      }
    }
    return data;
  }
  
  private getFormData() {
    const data = new FormData();
    for (let key in this.data) {
      for (let i = 0; i < this.data[key].length; i++) {
        data.append(key, this.data[key][i]);
      }
    }
    return data;
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
  
  public static getCanceler() {
    const canceler = {
      aborted: false,
      abort:   () => canceler.aborted = true,
    };
    return canceler;
  }
  
}

export interface FetchData {
  [key: string]: FetchDataType;
}

export type FetchDataType = File | undefined | null | boolean | number | string | object | Date;
