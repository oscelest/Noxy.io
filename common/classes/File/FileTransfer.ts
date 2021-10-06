export default class FileTransfer {

  public file: File;
  public name: string;
  public progress: number;
  public error?: Error;
  public completed: boolean;
  public cancelled: boolean;
  public cancel_handler?: (message?: string) => void;
  public progress_handler: ProgressEventHandler

  constructor(file: File | FileTransfer) {
    if (file instanceof FileTransfer) file = file.file;
    this.file = file;
    this.name = file.name;
    this.progress = 0;
  }

  public cancel() {
    this.progress =  Number.NEGATIVE_INFINITY;
    this.error = undefined;
    this.cancelled = true;
    return this;
  }

  public advance(file: Partial<FileTransfer>) {
    return Object.assign(this, file);
  }

  public complete() {
    this.progress = Number.POSITIVE_INFINITY;
    this.error = undefined;
    return this;
  }

  public fail(error?: string | Error, fatal: boolean = false) {
    this.progress = fatal ? Number.NEGATIVE_INFINITY : 0;
    this.error = typeof error === "string" ? new Error(error) : error;
    return this;
  }

}

export type ProgressEventHandler = (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
