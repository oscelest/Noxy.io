import {v4} from "uuid";
import XHRState from "../enums/XHRState";
import ServerException from "../exceptions/ServerException";

export default class ProgressHandler<Data = any> {
  
  public id: string;
  public data: Data
  public state: XHRState;
  public error?: ServerException;
  public progress: number;
  public progress_handler: ProgressEventHandler<Data> | undefined;
  
  constructor(data?: Data, progress_handler?: ProgressEventHandler<Data>) {
    this.id = v4();
    this.data = data as any;
    this.state = XHRState.UNSENT;
    this.progress = 0;
    this.progress_handler = progress_handler;
  }
  
  public complete() {
    this.state = XHRState.DONE;
    this.error = undefined;
    this.progress = 100;
  }
  
  public fail(error: ServerException) {
    this.error = error;
    this.state = XHRState.DONE;
    this.progress = 100;
  }
  
  public cancel() {
    this.state = XHRState.DONE;
    this.error = new ServerException(0, {});
    this.progress = 100;
  }
  
}

export type ProgressEventHandler<Data = any> = (handler: ProgressHandler<Data>, event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
