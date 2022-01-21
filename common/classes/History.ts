import Util from "../services/Util";
import HistoryException from "../exceptions/HistoryException";

export default class History<O> {

  readonly #pointer: number;
  readonly #value_list: O[];

  constructor(pointer: number = 0, ...value_list: (O | O[])[]) {
    this.#value_list = [];

    for (let i = 0; i < value_list.length; i++) {
      const value = value_list[i];
      Array.isArray(value) ? this.#value_list.push(...value) : this.#value_list.push(value);
    }

    this.#pointer = Util.clamp(pointer, this.#value_list.length - 1);
  }

  public get value() {
    return this.#value_list[this.#pointer];
  }

  public get pointer() {
    return this.#pointer;
  }

  public push(...value_list: (O | O[])[]) {
    const new_pointer = this.#pointer + 1;
    const new_value_list = this.#value_list.slice(0, new_pointer);

    for (let i = 0; i < value_list.length; i++) {
      const value = value_list[i];
      Array.isArray(value) ? new_value_list.push(...value) : new_value_list.push(value);
    }

    return new History<O>(new_pointer, new_value_list);
  }

  public loadPoint(pointer: number) {
    if (pointer < 0 || pointer >= this.#value_list.length) throw new HistoryException(`Could not load history point (Pointer: ${pointer}) from history`);
    return new History(pointer, this.#value_list.slice(0, pointer + 1));
  }

  public forward() {
    if (this.#pointer === this.#value_list.length - 1) return this;
    return new History(this.#pointer + 1, this.#value_list);
  }

  public backward() {
    if (this.#pointer <= 0) return this;
    return new History(this.#pointer - 1, this.#value_list);
  }

}
