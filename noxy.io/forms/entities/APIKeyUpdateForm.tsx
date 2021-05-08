import React from "react";
import Permission from "../../../common/classes/Permission";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import PermissionExplorer from "../../components/Application/PermissionExplorer";
import Button from "../../components/Form/Button";
import APIKeyEntity from "../../entities/APIKeyEntity";
import Global from "../../Global";
import Style from "./APIKeyUpdateForm.module.scss";

export default class APIKeyUpdateForm extends React.Component<APIKeyUpdateFormProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: APIKeyUpdateFormProps) {
    super(props);

    this.state = {
      entity:       new APIKeyEntity(),
      loading:      false,
      field_errors: {},
    };
  }

  public readonly submit = async () => {
    const {id, permission, limit_per_decasecond, limit_per_minute} = this.state.entity;

    try {
      const entity = await APIKeyEntity.update(id, {permission, limit_per_decasecond, limit_per_minute});
      return entity.getPrimaryKey() === this.context.state.user?.getCurrentAPIKey().getPrimaryKey() ? this.context.refreshLogIn() : this.setState({entity});
    }
    catch (error) {
      console.error(error);
    }
  };

  public componentDidMount() {
    this.setState({entity: new APIKeyEntity(this.props.entity)});
  }

  public componentDidUpdate(prevProps: Readonly<APIKeyUpdateFormProps>, prevState: Readonly<State>, snapshot?: any) {
    if (this.props.entity.getPrimaryKey() !== prevProps.entity.getPrimaryKey()) {
      this.setState({entity: new APIKeyEntity(this.props.entity)});
    }
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>

        <PermissionExplorer permission={this.state.entity.permission} onChange={this.eventPermissionChange}/>
        {this.renderUpdateButton()}


      </div>
    );
  }

  private readonly renderUpdateButton = () => {
    if (!this.state.entity.hasPermission(PermissionLevel.API_KEY_UPDATE)) return null;

    return (
      <Button className={Style.Submit} onClick={this.submit}>Update</Button>
    )
  }

  private readonly eventPermissionChange = (permission: Permission) => {
    this.setState({entity: new APIKeyEntity({...this.state.entity, permission})});
  };
}

export interface APIKeyUpdateFormProps {
  entity: APIKeyEntity

  className?: string

  onSubmit?: (api_key: APIKeyEntity) => void
}

interface State {
  entity: APIKeyEntity
  loading: boolean

  error?: Error
  field_errors: Partial<Record<keyof Omit<State, "loading" | "error" | "field_errors">, Error>>
}
