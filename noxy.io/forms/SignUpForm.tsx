import {AxiosResponse} from "axios";
import IsEmail from "isemail";
import _ from "lodash";
import React from "react";
import Button from "../components/Form/Button";
import Input from "../components/Form/Input";
import ErrorText from "../components/Text/ErrorText";
import TitleText from "../components/Text/TitleText";
import ButtonType from "../enums/ButtonType";
import InputType from "../enums/InputType";
import Global from "../Global";
import Style from "./SignUpForm.module.scss";

export default class LogInForm extends React.Component<SignUpFormProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: SignUpFormProps) {
    super(props);
    this.state = {
      email:    "",
      username: "",
      password: "",
      confirm:  "",

      flag_loading: false,
      field_errors: {},
    };
  }

  public readonly submit = async () => {
    const {email, username, password, confirm} = this.state;
    const next_state = {error: undefined, field_errors: {}} as State;

    if (!email.length) {
      next_state.field_errors.email = new Error("Please enter your email");
    }
    else if (!IsEmail.validate(email)) next_state.field_errors.email = new Error("Please enter a valid email");

    if (!username.length) {
      next_state.field_errors.username = new Error("Please enter your username");
    }
    else if (username.length < 3 || username.length > 32) next_state.field_errors.username = new Error("Username must be between 3 and 32 characters long");

    if (!password.length) {
      next_state.field_errors.password = new Error("Please enter your password");
    }
    else if (password.length < 12) next_state.field_errors.password = new Error("Password must be at least 12 characters long");

    if (!confirm.length) {
      next_state.field_errors.confirm = new Error("Please confirm your password");
    }
    else if (password !== confirm) next_state.field_errors.confirm = new Error("Passwords do not match");

    if (!_.size(next_state.field_errors)) {
      next_state.flag_loading = true;
      try {
        this.setState(next_state);
        await this.context.performSignUp(email, username, password);
      }
      catch (error) {
        const response = error.response as AxiosResponse<APIRequest<unknown>>;

        if (response?.status === 400) {
          next_state.error = new Error("Email and password does not match any account");
        }
        if (response?.status === 409) {
          next_state.error = new Error("Email already exists in the system.");
        }
        else {
          next_state.error = new Error("Unexpected server error occurred.");
        }
      }
      finally {
        next_state.flag_loading = false;
        this.setState(next_state);
      }
    }
    else {
      this.setState(next_state);
    }
  };

  public render() {
    const {email, username, password, confirm, field_errors} = this.state;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <TitleText>Sign Up</TitleText>
        {this.renderError()}
        <Input type={InputType.EMAIL} label={"Email"} value={email} error={field_errors.email} onChange={this.eventInputEmailChange}/>
        <Input type={InputType.TEXT} label={"Username"} value={username} error={field_errors.username} onChange={this.eventInputUsernameChange}/>
        <Input type={InputType.PASSWORD} label={"Password"} value={password} error={field_errors.password} onChange={this.eventInputPasswordChange}/>
        <Input type={InputType.PASSWORD} label={"Confirm password"} value={confirm} error={field_errors.confirm} onChange={this.eventInputConfirmChange}/>
        <Button type={ButtonType.SUCCESS} loading={this.state.flag_loading} onClick={this.submit}>Submit</Button>
      </div>
    );
  }

  private readonly renderError = () => {
    if (!this.state.error) return;

    return (
      <ErrorText>{this.state.error?.message}</ErrorText>
    );
  };

  private readonly eventInputEmailChange = (email: string) => this.setState({email});
  private readonly eventInputUsernameChange = (username: string) => this.setState({username});
  private readonly eventInputPasswordChange = (password: string) => this.setState({password});
  private readonly eventInputConfirmChange = (confirm: string) => this.setState({confirm});

}

export interface SignUpFormProps {
  className?: string

  onValidate?: () => void
  onSubmit?: () => void
}

interface State {
  email: string
  username: string
  password: string
  confirm: string

  flag_loading: boolean
  error?: Error
  field_errors: Partial<Record<keyof Omit<State, "flag_loading" | "error" | "field_errors">, Error>>
}
