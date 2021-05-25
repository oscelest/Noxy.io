export default class KanbanCardContent {

  public name: string;
  public description: string;
  public priority: number;

  constructor(initializer?: Initializer<KanbanCardContent>) {
    this.name = initializer?.name ?? "New card";
    this.description = initializer?.description ?? "";
    this.priority = initializer?.priority ?? NaN;
  }

  public toJSON() {
    return {
      name: this.name,
      description: this.description,
      priority: this.priority
    }
  }

}
