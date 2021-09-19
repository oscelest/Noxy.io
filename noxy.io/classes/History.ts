import Util from "../../common/services/Util";

export default class History<O> {

  $pointer: number;
  $value_list: O[]

  constructor(pointer: number = 0, ...value_list: (O | O[])[]) {
    this.$value_list = [];
    
    for (let i = 0; i < value_list.length; i++) {
      const value = value_list[i];
      Array.isArray(value) ? this.$value_list.push(...value) : this.$value_list.push(value);
    }
    
    this.$pointer = Util.clamp(pointer, this.$value_list.length - 1);
  }
  
  public get value() {
    return this.$value_list[this.$pointer]
  }
  
  public push(...value_list: (O | O[])[]) {
    const new_value_list = this.$value_list.slice(0, this.$pointer);
  
    for (let i = 0; i < value_list.length; i++) {
      const value = value_list[i];
      Array.isArray(value) ? new_value_list.push(...value) : new_value_list.push(value);
    }
    
    return new History<O>(this.$pointer, new_value_list);
  }
  
  public forward() {
    if (this.$pointer === this.$value_list.length - 1) return this;
    return new History(this.$pointer + 1, this.$value_list);
  }
  
  public backward() {
    if (this.$pointer === 0) return this;
    return new History(this.$pointer - 1, this.$value_list);
  }
  
}
