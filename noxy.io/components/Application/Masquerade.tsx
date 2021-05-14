import React from "react";
import Order from "../../../common/enums/Order";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import UserEntity from "../../entities/UserEntity";
import Global from "../../Global";
import EntityInput from "../Form/EntityInput";
import Authorized from "./Authorized";
import Style from "./Masquerade.module.scss";

export class Masquerade extends React.Component<UserComboBoxProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: UserComboBoxProps) {
    super(props);
  }

  public setUser = (user: UserEntity) => {
    if (user.id === (this.context?.state.masquerade ?? this.context?.state.user)?.id) return;
    this.context.masquerade(user);
    setTimeout(() => this.props.onChange?.(user));
  };

  public render() {
    if (!this.context.hasPermission(PermissionLevel.USER_MASQUERADE)) return null;

    const user = this.context?.state.masquerade ?? this.context?.state.user;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <Authorized>
        <EntityInput className={classes.join(" ")} value={user} label={"Masquerade as"} method={this.eventSearch} property={"email"} onChange={this.eventChange}/>
      </Authorized>
    );
  }

  private readonly eventSearch = async (email: string) => {
    if (!email) return [];
    return await UserEntity.get({email}, {skip: 0, limit: 10, order: {email: Order.ASC}});
  };

  private readonly eventChange = (user?: UserEntity) => {
    if (user) this.setUser(user);
  };

}

export interface UserComboBoxProps {
  className: string

  onChange?: (user: UserEntity) => void
}

interface State {

}
