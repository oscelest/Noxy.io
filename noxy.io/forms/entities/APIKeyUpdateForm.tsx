import React from "react";
import Permission from "../../../common/classes/Permission";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import PermissionExplorer from "../../components/Application/PermissionExplorer";
import Form from "../../components/Base/Form";
import APIKeyEntity from "../../entities/APIKeyEntity";
import Style from "./APIKeyUpdateForm.module.scss";
import Global from "../../Global";

export default class APIKeyUpdateForm extends React.Component<APIKeyUpdateFormProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: APIKeyUpdateFormProps) {
    super(props);

    this.state = {
      entity:  new APIKeyEntity(),
      loading: false,
    };
  }

  public readonly submit = async () => {
    const {id, permission, limit_per_decasecond, limit_per_minute} = this.state.entity;

    try {
      const entity = await APIKeyEntity.update(id, {permission, limit_per_decasecond, limit_per_minute});
      return entity.getPrimaryID() === this.context.state.user?.getCurrentAPIKey().getPrimaryID() ? this.context.refreshLogIn() : this.setState({entity});
    }
    catch (error) {
      console.error(error);
    }
  };

  public componentDidMount() {
    this.setState({entity: new APIKeyEntity(this.props.entity)});
  }

  public componentDidUpdate(prevProps: Readonly<APIKeyUpdateFormProps>, prevState: Readonly<State>, snapshot?: any) {
    if (this.props.entity.getPrimaryID() !== prevProps.entity.getPrimaryID()) {
      this.setState({entity: new APIKeyEntity(this.props.entity)});
    }
  }

  public render() {
    const {entity, loading, error} = this.state;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    const api_key_update_check = this.context.hasPermission(PermissionLevel.API_KEY_UPDATE);
    const other_admin_check = entity.hasPermission(PermissionLevel.ADMIN) && this.context.state.masquerade && this.context.state.user?.id !== this.context.state.masquerade?.id;
    const onSubmit = api_key_update_check && !other_admin_check ? this.submit : undefined;

    return (
      <Form className={classes.join(" ")} loading={loading} error={error} onSubmit={onSubmit}>
        <PermissionExplorer permission={this.state.entity.permission} onChange={this.eventPermissionChange}/>
      </Form>
    );
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
}
