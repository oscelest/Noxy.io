import {AxiosResponse} from "axios";
import _ from "lodash";
import React from "react";
import Style from "./BoardContentEditForm.module.scss";
import Form from "../../components/UI/Form";
import BoardCardEntity from "../../entities/board/BoardCardEntity";
import BoardLaneEntity from "../../entities/board/BoardLaneEntity";
import Helper from "../../Helper";
import FatalException from "../../exceptions/FatalException";

export default class BoardContentEditForm<E extends BoardCardEntity | BoardLaneEntity> extends React.Component<BoardCardEditFormProps<E>, State> {

  constructor(props: BoardCardEditFormProps<E>) {
    super(props);
    this.state = {
      loading:      false,
      field_errors: {},

      content: Helper.renderJSON(props.entity.content),
    };
  }

  public readonly submit = async () => {
    const {content} = this.state;
    const next_state = {field_errors: {}} as State;

    if (!content.length) {
      next_state.field_errors.content = new Error("");
    }

    if (!_.size(next_state.field_errors)) {
      next_state.loading = true;
      try {
        this.setState(next_state);

        const entity = await this.updateEntity(_.attempt(() => JSON.parse(content)) instanceof Error ? `"${content}"` : content);
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

  private readonly updateEntity = async (content: any) => {
    if (this.props.entity instanceof BoardLaneEntity) return await BoardLaneEntity.updateOne(this.props.entity.id, {content: JSON.parse(content)}) as E;
    if (this.props.entity instanceof BoardCardEntity) return await BoardCardEntity.updateOne(this.props.entity.id, {content: JSON.parse(content)}) as E;
    throw new FatalException("Saving of edit failed", `Unknown type of entity being edited and could therefore not be saved for "${content}"`);
  };

  public render() {
    const {content, loading, error, field_errors} = this.state;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <Form className={classes.join(" ")} loading={loading} error={error} onSubmit={this.submit}>
        <span className={Style.Title}>Content - {field_errors.content?.message}</span>
        <textarea value={content} onChange={this.eventContentChange}/>
      </Form>
    );
  }

  private readonly eventContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({content: event.currentTarget.value});
  };

}

export interface BoardCardEditFormProps<E extends BoardCardEntity | BoardLaneEntity> {
  className?: string

  entity: E;

  onSubmit?(new_entity: E, old_entity: E): void
}

interface State {
  content: string

  loading: boolean
  error?: Error
  field_errors: Partial<Record<keyof Omit<State, "loading" | "error" | "field_errors">, Error>>
}
