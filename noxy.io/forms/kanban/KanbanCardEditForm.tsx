import {AxiosResponse} from "axios";
import _ from "lodash";
import React from "react";
import Style from "./KanbanCardEditForm.module.scss";
import Form from "../../components/Base/Form";
import BoardCardEntity from "../../entities/board/BoardCardEntity";
import KanbanCardContent from "../../classes/KanbanCardContent";
import BoardEntity from "../../entities/board/BoardEntity";
import {BoardCardType} from "../../components/Application/BoardExplorer";
import Input from "../../components/Form/Input";

export default class KanbanCardEditForm<Card extends BoardCardType<BoardEntity<KanbanCardContent>>> extends React.Component<KanbanCardEditFormProps<Card>, State> {

  constructor(props: KanbanCardEditFormProps<Card>) {
    super(props);
    this.state = {
      name:        props.entity.content.name,
      description: props.entity.content.description,
      priority:    props.entity.content.priority,

      loading:      false,
      field_errors: {},
    };
  }

  public readonly submit = async () => {
    const content = new KanbanCardContent(this.state);
    const next_state = {field_errors: {}} as State;

    if (!content.name.length) {
      next_state.field_errors.name = new Error("");
    }

    if (!_.size(next_state.field_errors)) {
      next_state.loading = true;
      try {
        this.setState(next_state);

        const entity = await BoardCardEntity.updateOne(this.props.entity.id, {content: content.toJSON()}) as Card;
        this.props.onSubmit?.(entity, this.props.entity);
        next_state.error = undefined;
      }
      catch (error) {
        const response = error.response as AxiosResponse<APIRequest<unknown>>;

        if (response?.status === 400) {
          next_state.error = new Error("Form has not been filled properly.");
        }
        else {
          next_state.error = new Error("Unexpected server error occurred.");
        }
      }
    }

    next_state.loading = false;
    this.setState(next_state);
  };

  public render() {
    const {name, description, priority} = this.state;
    const {loading, error, field_errors} = this.state;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <Form className={classes.join(" ")} loading={loading} error={error} onSubmit={this.submit}>
        <Input label={"Name"} value={name} error={field_errors.name} onChange={this.eventNameChange}/>
        <Input label={"Description"} value={description} error={field_errors.description} onChange={this.eventDescriptionChange}/>
        <Input label={"Priority"} value={priority} error={field_errors.priority} onChange={this.eventPriorityChange}/>

      </Form>
    );
  }

  private readonly eventNameChange = (name: string) => {
    this.setState({name});
  };
  
  private readonly eventDescriptionChange = (description: string) => {
    this.setState({description});
  };

  private readonly eventPriorityChange = (priority: number) => {
    this.setState({priority});
  };

}

export interface KanbanCardEditFormProps<T extends BoardCardType<BoardEntity<KanbanCardContent>>> {
  className?: string

  entity: T

  onSubmit?(new_entity: T, old_entity: T): void
}

interface State {
  name: string
  description: string
  priority: number

  loading: boolean
  error?: Error
  field_errors: Partial<Record<keyof Omit<State, "loading" | "error" | "field_errors">, Error>>
}
