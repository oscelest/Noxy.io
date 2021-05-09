import {AxiosResponse} from "axios";
import IsEmail from "isemail";
import _ from "lodash";
import React from "react";
import Button from "../components/Form/Button";
import Input from "../components/Form/Input";
import ErrorText from "../components/Text/ErrorText";
import TitleText from "../components/Text/TitleText";
import UserEntity from "../entities/UserEntity";
import InputType from "../enums/InputType";
import Global from "../Global";
import Style from "./PasswordResetRequestForm.module.scss";

export default class PasswordResetRequestForm extends React.Component<PasswordResetRequestFormProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: PasswordResetRequestFormProps) {
    super(props);
    this.state = {
      flag_loading: false,
      field_errors: {},

      email: "",
    };
  }

  public readonly submit = async () => {
    const {email} = this.state;
    const next_state = {error: undefined, field_errors: {}} as State;

    if (!email.length) {
      next_state.field_errors.email = new Error("Please enter your email");
    }
    else if (!IsEmail.validate(email)) {
      next_state.field_errors.email = new Error("Email is invalid");
    }

    if (!_.size(next_state.field_errors)) {
      next_state.flag_loading = true;
      try {
        this.setState(next_state);
        await UserEntity.requestPasswordReset(email);
        next_state.error = new Error("An email has been sent.");
      }
      catch (error) {
        const response = error.response as AxiosResponse<APIRequest<unknown>>;

        if (response?.status === 400) {
          next_state.error = new Error("Email is not valid.");
        }
        else if (response?.status === 404) {
          next_state.error = new Error("Email does not have an account attached.");
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
    const {email, flag_loading, field_errors} = this.state;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <TitleText>Reset password</TitleText>
        {this.renderError()}
        <Input className={Style.Input} type={InputType.EMAIL} label={"Email"} value={email} error={field_errors.email} autoComplete={"username"} onChange={this.eventInputEmailChange}/>
        <Button className={Style.Button} loading={flag_loading} onClick={this.submit}>Submit</Button>
      </div>
    );
  }

  private readonly renderError = () => {
    if (!this.state.error) return;

    return (
      <ErrorText className={Style.Error}>{this.state.error?.message}</ErrorText>
    );
  };

  private readonly eventInputEmailChange = (email: string) => this.setState({email});
}

export interface PasswordResetRequestFormProps {
  className?: string
}

interface State {
  flag_loading: boolean
  field_errors: Partial<Record<keyof Omit<State, "flag_loading" | "error" | "field_errors">, Error>>
  error?: Error

  email: string
}
