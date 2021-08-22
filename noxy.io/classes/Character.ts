import {v4} from "uuid";
import {Decoration, StyleInitializer} from "./Decoration";

export class Character {

  public id: string;
  public value: string;
  public decoration: Decoration;

  constructor(value: string, decoration?: Initializer<Decoration>) {
    this.id = v4();
    this.value = value;
    this.decoration = new Decoration(decoration);
  }

  public toJSON() {
    const json = [this.value, this.decoration.toJSON()];
    return JSON.stringify(json);
  }

}

export type CharacterInitializer = [string, StyleInitializer]
