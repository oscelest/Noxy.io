import Order from "../enums/Order";
import Util from "../services/Util";

export default class Pagination<O extends {}> {
  
  public skip: number;
  public limit: number;
  public order: RequestPaginationOrder<O>;
  
  constructor(skip: number, limit: number, order: RequestPaginationOrder<O>) {
    this.skip = skip;
    this.limit = limit;
    this.order = order;
  }
  
  public toObject() {
    const parsed_order = [];
    const keys = Util.getProperties(this.order);
    for (let i = 0; i < keys.length; i++) {
      const key = keys.at(i);
      if (!key) continue;
      
      const value = this.order[key];
      parsed_order.push(`${value === Order.ASC ? "" : "-"}${key}`);
    }
    
    return {
      skip:  this.skip,
      limit: this.limit,
      order: parsed_order,
    };
  }
  
}

export type RequestPaginationOrder<O extends {}> = { [K in keyof Pick<O, { [K in keyof O]: O[K] extends Function ? never : K }[keyof O]>]?: Order }
