import {AxiosResponse} from "axios";
import _ from "lodash";
import Router from "next/router";
import React from "react";
import Button from "../components/Form/Button";
import Input from "../components/Form/Input";
import ErrorText from "../components/Text/ErrorText";
import TitleText from "../components/Text/TitleText";
import UserEntity from "../entities/UserEntity";
import ButtonType from "../enums/components/ButtonType";
import InputType from "../enums/components/InputType";
import Global from "../Global";
import Style from "./PasswordResetConfirmForm.module.scss";

export default class PasswordResetConfirmForm extends React.Component<PasswordResetConfirmFormProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: PasswordResetConfirmFormProps) {
    super(props);
    this.state = {
      flag_loading: false,
      field_errors: {},

      password: "",
      confirm:  "",
    };
  }

  public readonly submit = async () => {
    const {password, confirm} = this.state;
    const next_state = {error: undefined, field_errors: {}} as State;

    if (!password.length) {
      next_state.field_errors.password = new Error("Please enter your password");
    }
    else if (password.length < 12) {
      next_state.field_errors.password = new Error("Password must be at least 12 characters long");
    }

    if (!confirm.length) {
      next_state.field_errors.confirm = new Error("Please confirm your password");
    }
    else if (password !== confirm) {
      next_state.field_errors.confirm = new Error("Passwords do not match");
    }

    if (!_.size(next_state.field_errors)) {
      next_state.flag_loading = true;
      try {
        this.setState(next_state);
        await UserEntity.confirmPasswordReset(this.props.token, password);
        return Router.push("/account");
      }
      catch (error) {
        const response = error.response as AxiosResponse<APIRequest<unknown>>;

        if (response?.status === 400) {
          next_state.error = new Error("New password is not valid.");
        }
        else if (response?.status === 404) {
          next_state.error = new Error("Reset token has been tampered with.");
        }
        else if (response?.status === 410) {
          next_state.error = new Error("Reset password token has expired.");
        }
        else {
          next_state.error = new Error("Unexpected server error occurred.");
        }
      }
    }
    next_state.flag_loading = false;
    this.setState(next_state);
  };

  public render() {
    const {password, confirm, flag_loading, field_errors} = this.state;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <TitleText>Create your new password</TitleText>
        {this.renderError()}
        <Input className={Style.Input} type={InputType.PASSWORD} label={"Password"} value={password} error={field_errors.password} autoComplete={"password"} onChange={this.eventInputPasswordChange}/>
        <Input className={Style.Input} type={InputType.PASSWORD} label={"Confirm"} value={confirm} error={field_errors.confirm} autoComplete={"password"} onChange={this.eventInputConfirmChange}/>
        <Button className={Style.Button} type={ButtonType.SUCCESS} loading={flag_loading} onClick={this.submit}>Change password</Button>
      </div>
    );
  }

  private readonly renderError = () => {
    if (!this.state.error) return;

    return (
      <ErrorText className={Style.Error}>{this.state.error?.message}</ErrorText>
    );
  };

  private readonly eventInputPasswordChange = (password: string) => this.setState({password});
  private readonly eventInputConfirmChange = (confirm: string) => this.setState({confirm});
}

export interface PasswordResetConfirmFormProps {
  className?: string
  token: string
}

interface State {
  flag_loading: boolean
  field_errors: Partial<Record<keyof Omit<State, "flag_loading" | "error" | "field_errors">, Error>>
  error?: Error

  password: string
  confirm: string
}
