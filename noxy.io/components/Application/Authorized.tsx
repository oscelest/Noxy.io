import React from "react";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import Size from "../../enums/Size";
import LogInForm from "../../forms/LogInForm";
import SignUpForm from "../../forms/SignUpForm";
import Global from "../../Global";
import TitleText from "../Text/TitleText";
import Loader from "../UI/Loader";
import Placeholder from "../UI/Placeholder";
import Style from "./Authorized.module.scss";

export default class Authorized extends React.Component<AuthorizedProps, State> {

  public static contextType = Global.Context;
  public context: Global.Context;

  constructor(props: AuthorizedProps) {
    super(props);
  }

  public render() {
    if (this.context.state.loading) return this.renderLoader();
    if (this.props.permission === null) return this.props.children;
    if (!this.context.state.user) return this.renderForm();
    if (this.props.permission && !this.context.hasPermission(this.props.permission)) return this.renderError();

    return this.props.children;
  }

  private readonly renderLoader = () => {
    return (
      <Loader className={Style.Loader} size={this.props.size} show={this.context.state.loading}/>
    );
  };

  private readonly renderError = () => {
    return (
      <Placeholder show={true} className={Style.Placeholder} text={"You do not have permission to view this page."}/>
    );
  };

  private readonly renderForm = () => {
    if (!this.props.form) return null;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <div className={Style.Form}>
          <TitleText>Log In</TitleText>
          <LogInForm/>
        </div>
        <div className={Style.Form}>
          <TitleText>Sign Up</TitleText>
          <SignUpForm/>
        </div>
      </div>
    );
  };

}

export interface AuthorizedProps {
  form?: boolean
  size?: Size
  permission?: PermissionLevel | null

  className?: string
}

interface State {

}
