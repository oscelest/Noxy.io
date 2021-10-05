export default class ProgressHandler {
  
  #cancelled: boolean
  
  readonly #progress_handler: ProgressEventHandler | undefined;
  
  constructor(progress_handler?: ProgressEventHandler) {
    this.#cancelled = false;
    this.#progress_handler = progress_handler;
  }
  
  public get cancelled() {
    return this.#cancelled;
  }
  
  public get progress_handler() {
    return this.#progress_handler;
  }
  
  public cancel() {
    this.#cancelled = true;
  }
  
}

export type ProgressEventHandler = (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
