import {v4} from "uuid";
import XHRState from "../enums/XHRState";

export default class ProgressHandler<Data = any> {
  
  public id: string;
  public data: Data
  public state: XHRState;
  public error: Error;
  public progress: number;
  public cancelled: boolean;
  public progress_handler: ProgressEventHandler<Data> | undefined;
  
  constructor(data?: Data, progress_handler?: ProgressEventHandler<Data>) {
    this.id = v4();
    this.data = data as any;
    this.state = XHRState.UNSENT;
    this.progress = 0;
    this.cancelled = false;
    this.progress_handler = progress_handler;
  }
  
  public fail(error: Error) {
    this.error = error;
  }
  
  public cancel() {
    this.cancelled = true;
  }
  
}

export type ProgressEventHandler<Data = any> = (handler: ProgressHandler<Data>, event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
