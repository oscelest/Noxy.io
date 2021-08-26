import {v4} from "uuid";
import Decoration from "./Decoration";

export default class Character {

  public readonly id: string;
  public readonly value: string;
  public readonly decoration: Decoration;

  constructor(value: string, decoration?: Initializer<Decoration>) {
    this.id = v4();
    this.value = value;
    this.decoration = new Decoration(decoration);
  }

  public static getSegmentList(line: Character[]) {
    const segment_list = [] as CharacterSegment[];

    for (let j = 0; j < line.length; j++) {
      const character = line[j];
      const segment = segment_list[segment_list.length - 1];

      if (!segment || !character.decoration.equals(segment.decoration)) {
        segment_list.push({text: [character], decoration: character.decoration});
      }
      else {
        segment.text.push(character);
      }
    }
    return segment_list;
  };


}

export interface CharacterSegment {
  text: Character[],
  decoration: Decoration
}
