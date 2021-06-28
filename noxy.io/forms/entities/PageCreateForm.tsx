import {AxiosResponse} from "axios";
import _ from "lodash";
import React from "react";
import Input from "../../components/Form/Input";
import Form from "../../components/Base/Form";
import InputType from "../../enums/InputType";
import FatalException from "../../exceptions/FatalException";
import Style from "./PageCreateForm.module.scss";
import PageEntity from "../../entities/page/PageEntity";
import Component from "../../components/Application/Component";

export default class PageCreateForm extends Component<PageCreateFormProps, State> {

  constructor(props: PageCreateFormProps) {
    super(props);

    this.state = {
      loading:      false,
      field_errors: {},

      entity: this.props.initial ?? new PageEntity(),
    };
  }

  public readonly submit = async () => {
    const {name, path} = this.state.entity as PageEntity;
    const next_state = {error: undefined, field_errors: {}} as State;

    if (!name) next_state.field_errors.name = new Error();
    if (!path) next_state.field_errors.path = new Error();

    if (!_.size(next_state.field_errors)) {
      next_state.loading = true;
      try {
        this.setState(next_state);
        const api_key = await PageEntity.postOne(this.state.entity);
        setTimeout(() => this.props.onSubmit?.(api_key));

        next_state.entity = new PageEntity();
      }
      catch (error) {
        const response = error.response as AxiosResponse<APIRequest<any>>;

        if (response?.status === 400) {
          if (response.data.content.path) {
            next_state.field_errors.path = new Error("Must be alphanumeric or dashes");
          }
        }
        else if (response?.status === 409) {
          next_state.error = new Error("Path already exists");
        }
        else {
          next_state.error = error;
        }
      }
    }
    next_state.loading = false;
    this.setState(next_state);
  };

  public componentDidMount() {
    if (!this.context.state.user) throw new FatalException("No user found", "It is not possible to load the API Key creation form without being logged in.");
    this.setState({entity: new PageEntity({...this.state.entity, user: this.context.state.user})});
  }

  public render() {
    const {loading, error, field_errors} = this.state;
    const {name, path} = this.state.entity;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <Form className={classes.join(" ")} loading={loading} error={error} onSubmit={this.submit}>
        <div className={Style.InputList}>
          <Input className={Style.ComboBox} type={InputType.NUMBER} label={"Name"} value={name} error={field_errors.name} required={true} onChange={this.eventNameChange}/>
          <Input className={Style.ComboBox} type={InputType.NUMBER} label={"Path"} value={path} error={field_errors.path} required={true} onChange={this.eventPathChange}/>
        </div>
      </Form>
    );
  }

  private readonly eventNameChange = (name?: string) => {
    this.setState({entity: new PageEntity({...this.state.entity, name})});
  };

  private readonly eventPathChange = (path: string) => {
    this.setState({entity: new PageEntity({...this.state.entity, path})});
  };

}

export interface PageCreateFormProps {
  className?: string

  initial?: PageEntity

  onSubmit?: (api_key: PageEntity) => void
}

interface State {
  entity: PageEntity

  loading: boolean
  error?: Error
  field_errors: Partial<Record<keyof Pick<PageEntity, "name" | "path">, Error>>
}
