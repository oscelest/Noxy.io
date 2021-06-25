import {NextPageContext} from "next";
import React from "react";
import PasswordResetConfirmForm from "../forms/PasswordResetConfirmForm";
import PasswordResetRequestForm from "../forms/PasswordResetRequestForm";
import Style from "./reset.module.scss";
import Component from "../components/Application/Component";

// noinspection JSUnusedGlobalSymbols
export default class ResetPage extends Component<ResetPageProps, State> {

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): ResetPageProps {
    const token = (context.query[ResetPageQuery.token] ?? "");

    return {
      [ResetPageQuery.token]: Array.isArray(token) ? token[0] : token,
    };
  }

  constructor(props: ResetPageProps) {
    super(props);
  }


  public render() {
    return (
      <div className={Style.Component}>
        {this.props.token ? <PasswordResetConfirmForm token={this.props.token}/> : <PasswordResetRequestForm/>}
      </div>
    );
  }
}

enum ResetPageQuery {
  token = "token",
}

export interface ResetPageProps {
  [ResetPageQuery.token]: string
}

interface State {

}
