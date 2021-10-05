import {AxiosError} from "axios";
import _ from "lodash";
import React from "react";
import Permission from "../../../common/classes/Permission";
import Order from "../../../common/enums/Order";
import Component from "../../components/Application/Component";
import PermissionExplorer from "../../components/Application/PermissionExplorer";
import Form from "../../components/Base/Form";
import Button from "../../components/Form/Button";
import EntityInput from "../../components/Form/EntityInput";
import Input from "../../components/Form/Input";
import APIKeyEntity from "../../entities/APIKeyEntity";
import UserEntity from "../../entities/UserEntity";
import InputType from "../../enums/InputType";
import FatalException from "../../exceptions/FatalException";
import Style from "./APIKeyCreateForm.module.scss";

export default class APIKeyCreateForm extends Component<APIKeyCreateFormProps, State> {
  
  constructor(props: APIKeyCreateFormProps) {
    super(props);
    
    this.state = {
      loading:      false,
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
      next_state.loading = true;
      try {
        this.setState(next_state);
        const api_key = await APIKeyEntity.create({user, permission, limit_per_decasecond, limit_per_minute});
        setTimeout(() => this.props.onSubmit?.(api_key));
        
        next_state.entity = new APIKeyEntity();
      }
      catch (error) {
        const {response} = error as AxiosError<APIResponse<unknown>>;
        
        if (response?.status === 400) {
          next_state.error = new Error("Incorrect email and/or password");
        }
        else {
          next_state.error = error as Error;
        }
      }
    }
    next_state.loading = false;
    this.setState(next_state);
  };
  
  public componentDidMount() {
    if (!this.context.state.user) throw new FatalException("No user found", "It is not possible to load the API Key creation form without being logged in.");
    this.setState({entity: new APIKeyEntity({...this.state.entity, user: this.context.state.user})});
  }
  
  public render() {
    const {loading, error, field_errors} = this.state;
    const {user, permission, limit_per_decasecond, limit_per_minute} = this.state.entity;
    
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <Form className={classes.join(" ")} loading={loading} error={error} onSubmit={this.submit}>
        <div className={Style.InputList}>
          <EntityInput className={Style.ComboBox} label={"User"} value={user} error={field_errors.user} property={"email"} method={this.eventUserSearch} onChange={this.eventUserChange}/>
          <Input className={Style.ComboBox} type={InputType.NUMBER} label={"Limit per 10 seconds"} value={limit_per_decasecond.toString()} error={field_errors.limit_per_decasecond}
                 onChange={this.eventLimitPerDecasecondChange}/>
          <Input className={Style.ComboBox} type={InputType.NUMBER} label={"Limit per minute"} value={limit_per_minute.toString()} error={field_errors.limit_per_minute}
                 onChange={this.eventLimitPerMinuteChange}/>
        </div>
        <PermissionExplorer permission={permission} onChange={this.eventPermissionChange}/>
        <Button loading={loading} onClick={this.submit}>Submit</Button>
      </Form>
    );
  }
  
  private readonly eventUserSearch = async (email: string) => {
    return await UserEntity.getMany({email}, {skip: 0, limit: 10, order: {email: Order.ASC}});
  };
  
  private readonly eventUserChange = (user?: UserEntity) => {
    this.setState({entity: new APIKeyEntity({...this.state.entity, user: user ? user : new UserEntity()})});
  };
  
  private readonly eventPermissionChange = (permission: Permission) => {
    this.setState({entity: new APIKeyEntity({...this.state.entity, permission})});
  };
  
  private readonly eventLimitPerDecasecondChange = (value: string) => {
    const limit_per_decasecond = +value;
    if (!isNaN(limit_per_decasecond)) this.setState({entity: new APIKeyEntity({...this.state.entity, limit_per_decasecond})});
  };
  
  private readonly eventLimitPerMinuteChange = (value: string) => {
    const limit_per_minute = +value;
    if (!isNaN(limit_per_minute)) this.setState({entity: new APIKeyEntity({...this.state.entity, limit_per_minute})});
  };
  
}

export interface APIKeyCreateFormProps {
  className?: string;
  
  onSubmit?: (api_key: APIKeyEntity) => void;
}

interface State {
  entity: APIKeyEntity;
  
  loading: boolean;
  error?: Error;
  field_errors: Partial<Record<keyof Pick<APIKeyEntity, "permission" | "user" | "limit_per_decasecond" | "limit_per_minute">, Error>>;
}
