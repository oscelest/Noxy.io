import {AxiosResponse} from "axios";
import _ from "lodash";
import Router from "next/router";
import React from "react";
import Input from "../components/Form/Input";
import Form from "../components/Base/Form";
import UserEntity from "../entities/UserEntity";
import InputType from "../enums/InputType";
import Global from "../Global";
import Style from "./PasswordResetConfirmForm.module.scss";

export default class PasswordResetConfirmForm extends React.Component<PasswordResetConfirmFormProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: PasswordResetConfirmFormProps) {
    super(props);
    this.state = {
      loading:      false,
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
      next_state.loading = true;
      try {
        this.setState(next_state);
        await UserEntity.confirmPasswordReset(this.props.token, password);
        await this.props.onSubmit?.(this.props.token, password);
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
    next_state.loading = false;
    this.setState(next_state);
  };

  public render() {
    const {password, confirm, loading, error, field_errors} = this.state;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <Form className={classes.join(" ")} loading={loading} error={error} onSubmit={this.submit}>
        <Input type={InputType.PASSWORD} label={"Password"} value={password} error={field_errors.password} autoComplete={"password"} onChange={this.eventInputPasswordChange}/>
        <Input type={InputType.PASSWORD} label={"Confirm"} value={confirm} error={field_errors.confirm} autoComplete={"password"} onChange={this.eventInputConfirmChange}/>
      </Form>
    );
  }

  private readonly eventInputPasswordChange = (password: string) => {
    this.setState({password});
  };

  private readonly eventInputConfirmChange = (confirm: string) => {
    this.setState({confirm});
  };
}

export interface PasswordResetConfirmFormProps {
  className?: string

  token: string

  onSubmit?(token: string, password: string): void
}

interface State {
  password: string
  confirm: string

  loading: boolean
  error?: Error
  field_errors: Partial<Record<keyof Omit<State, "loading" | "error" | "field_errors">, Error>>
}
