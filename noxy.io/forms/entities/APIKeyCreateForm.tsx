import {AxiosResponse} from "axios";
import _ from "lodash";
import React from "react";
import Permission from "../../../common/classes/Permission";
import Order from "../../../common/enums/Order";
import PermissionExplorer from "../../components/Application/PermissionExplorer";
import Button from "../../components/Form/Button";
import EntityInput from "../../components/Form/EntityInput";
import Input from "../../components/Form/Input";
import ErrorText from "../../components/Text/ErrorText";
import TitleText from "../../components/Text/TitleText";
import APIKeyEntity from "../../entities/APIKeyEntity";
import UserEntity from "../../entities/UserEntity";
import ButtonType from "../../enums/ButtonType";
import InputType from "../../enums/InputType";
import Global from "../../Global";
import Style from "./APIKeyCreateForm.module.scss";

export default class APIKeyCreateForm extends React.Component<APIKeyCreateFormProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: APIKeyCreateFormProps) {
    super(props);

    this.state = {
      flag_loading: false,
      field_errors: {},

      entity: new APIKeyEntity(),
    };
  }

  public readonly submit = async () => {
    const {user, permission, limit_per_decasecond, limit_per_minute} = this.state.entity as Required<APIKeyEntity>;
    const next_state = {error: undefined, field_errors: {}} as State;

    if (!user) next_state.field_errors.user = new Error("Please select a user to create this API Key for");
    if (limit_per_decasecond < 0) next_state.field_errors.limit_per_decasecond = new Error("This field cannot be less than 0");
    if (limit_per_minute < 0) next_state.field_errors.limit_per_minute = new Error("This field cannot be less than 0");

    if (!_.size(next_state.field_errors)) {
      next_state.flag_loading = true;
      try {
        this.setState(next_state);
        const api_key = await APIKeyEntity.create({user, permission, limit_per_decasecond, limit_per_minute});
        setTimeout(() => this.props.onSubmit?.(api_key));

        next_state.entity = new APIKeyEntity();
      }
      catch (error) {
        const response = error.response as AxiosResponse<APIRequest<unknown>>;

        if (response?.status === 400) {
          next_state.error = new Error("Incorrect email and/or password");
        }
        else {
          next_state.error = error;
        }
      }
    }
    next_state.flag_loading = false;
    this.setState(next_state);
  };

  public componentDidMount() {
    this.setState({entity: new APIKeyEntity({...this.state.entity, user: this.context.state.user})});
  }

  public render() {
    const {flag_loading, field_errors} = this.state;
    const {user, permission, limit_per_decasecond, limit_per_minute} = this.state.entity;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <TitleText>Create API Key</TitleText>
        {this.renderError()}
        <div className={Style.InputList}>
          <EntityInput className={Style.ComboBox} label={"User"} value={user} error={field_errors.user} property={"email"} method={this.eventUserSearch} onChange={this.eventUserChange}/>
          <Input className={Style.ComboBox} type={InputType.NUMBER} label={"Limit per 10 seconds"} value={limit_per_decasecond} error={field_errors.limit_per_decasecond} onChange={this.eventInputLimitPerDecasecondChange}/>
          <Input className={Style.ComboBox} type={InputType.NUMBER} label={"Limit per minute"} value={limit_per_minute} error={field_errors.limit_per_minute} onChange={this.eventInputLimitPerMinuteChange}/>
        </div>
        <PermissionExplorer permission={permission} onChange={this.eventPermissionChange}/>
        <Button type={ButtonType.SUCCESS} loading={flag_loading} onClick={this.submit}>Submit</Button>
      </div>
    );
  }

  private readonly renderError = () => {
    if (!this.state.error) return;

    return (
      <ErrorText className={Style.Error}>{this.state.error?.message}</ErrorText>
    );
  };

  private readonly eventUserSearch = async (email: string) => email ? await UserEntity.get({email}, {skip: 0, limit: 10, order: {email: Order.ASC}}) : [];
  private readonly eventUserChange = (user?: UserEntity) => this.setState({entity: new APIKeyEntity({...this.state.entity, user: user ? user : new UserEntity()})});
  private readonly eventPermissionChange = (permission: Permission) => this.setState({entity: new APIKeyEntity({...this.state.entity, permission})});
  private readonly eventInputLimitPerDecasecondChange = (limit_per_decasecond: number) => this.setState({entity: new APIKeyEntity({...this.state.entity, limit_per_decasecond})});
  private readonly eventInputLimitPerMinuteChange = (limit_per_minute: number) => this.setState({entity: new APIKeyEntity({...this.state.entity, limit_per_minute})});

}

export interface APIKeyCreateFormProps {
  className?: string

  onSubmit?: (api_key: APIKeyEntity) => void
}

interface State {
  flag_loading: boolean

  error?: Error
  field_errors: Partial<Record<keyof Pick<APIKeyEntity, "permission" | "user" | "limit_per_decasecond" | "limit_per_minute">, Error>>

  entity: APIKeyEntity
}
