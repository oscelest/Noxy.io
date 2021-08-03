export default class FileTransfer {

  public file: File;
  public name: string;
  public progress: number;
  public error?: Error;
  public canceler?: (message?: string) => void;

  constructor(file: File | FileTransfer) {
    if (file instanceof FileTransfer) file = file.file;
    this.file = file;
    this.name = file.name;
    this.progress = 0;
  }

  public cancel() {
    if (this.canceler) this.canceler();
    this.progress =  Number.NEGATIVE_INFINITY;
    this.error = undefined;
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
