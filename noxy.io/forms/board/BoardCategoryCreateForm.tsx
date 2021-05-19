import {AxiosResponse} from "axios";
import _ from "lodash";
import React from "react";
import Style from "./BoardCategoryCreateForm.module.scss";
import BoardCategoryEntity from "../../entities/board/BoardCategoryEntity";
import InputType from "../../enums/InputType";
import Form from "../../components/UI/Form";
import Input from "../../components/Form/Input";
import BoardEntity from "../../entities/board/BoardEntity";

export default class BoardCategoryCreateForm extends React.Component<BoardCategoryCreateFormProps, State> {

  constructor(props: BoardCategoryCreateFormProps) {
    super(props);
    this.state = {
      loading:      false,
      field_errors: {},

      name: "",
    };
  }

  public readonly submit = async () => {
    const {name} = this.state;
    const next_state = {field_errors: {}} as State;

    if (!name.length) {
      next_state.field_errors.name = new Error("");
    }

    if (!_.size(next_state.field_errors)) {
      next_state.loading = true;
      try {
        this.setState(next_state);
        const entity = await BoardCategoryEntity.createOne({name, board: this.props.board});
        this.props.onSubmit?.(entity);
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
    const {name, loading, error, field_errors} = this.state;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <Form className={classes.join(" ")} loading={loading} error={error} onSubmit={this.submit}>
        <Input className={Style.Input} type={InputType.TEXT} label={"Name"} value={name} error={field_errors.name} onChange={this.eventInputNameChange}/>
      </Form>
    );
  }

  private readonly eventInputNameChange = (name: string) => {
    this.setState({name});
  };

}

export interface BoardCategoryCreateFormProps {
  className?: string

  board: BoardEntity;

  onSubmit?(entity: BoardCategoryEntity): void
}

interface State {
  dialog?: string

  loading: boolean
  error?: Error
  field_errors: Partial<Record<keyof Omit<State, "loading" | "error" | "field_errors">, Error>>

  name: string
}
