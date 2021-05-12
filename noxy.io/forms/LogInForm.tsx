import {AxiosResponse} from "axios";
import IsEmail from "isemail";
import _ from "lodash";
import React from "react";
import Dialog from "../components/Application/Dialog";
import Button from "../components/Form/Button";
import Input from "../components/Form/Input";
import ErrorText from "../components/Text/ErrorText";
import TitleText from "../components/Text/TitleText";
import IconType from "../enums/IconType";
import InputType from "../enums/InputType";
import Global from "../Global";
import Style from "./LogInForm.module.scss";
import PasswordResetRequestForm from "./PasswordResetRequestForm";

export default class LogInForm extends React.Component<LogInFormProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: LogInFormProps) {
    super(props);
    this.state = {
      flag_loading: false,
      field_errors: {},

      email:    "",
      password: "",
    };
  }

  public readonly submit = async () => {
    const {email, password} = this.state;
    const next_state = {error: undefined, field_errors: {}} as State;

    if (!email.length) {
      next_state.field_errors.email = new Error("Please enter your email");
    }
    else if (!IsEmail.validate(email)) next_state.field_errors.email = new Error("Email is invalid");

    if (!password.length) {
      next_state.field_errors.password = new Error("Please enter your password");
    }
    else if (password.length < 12) next_state.field_errors.password = new Error("Password is invalid");

    if (!_.size(next_state.field_errors)) {
      next_state.flag_loading = true;
      try {
        this.setState(next_state);
        await this.context.performLogIn(email, password);
      }
      catch (error) {
        const response = error.response as AxiosResponse<APIRequest<unknown>>;

        if (response?.status === 400) {
          next_state.error = new Error("Incorrect email and/or password");
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
    const {email, password, flag_loading, field_errors} = this.state;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <TitleText>Log In</TitleText>
        {this.renderError()}
        <div className={Style.Wrapper}>
          <Input className={Style.Input} type={InputType.EMAIL} label={"Email"} value={email} error={field_errors.email} autoComplete={"username"} onChange={this.eventInputEmailChange}/>
          <Button icon={IconType.QUESTION} onClick={this.eventButtonEmailClick}/>
        </div>
        <div className={Style.Wrapper}>
          <Input className={Style.Input} type={InputType.PASSWORD} label={"Password"} value={password} error={field_errors.password} autoComplete={"password"}
                 onChange={this.eventInputPasswordChange}/>
          <Button icon={IconType.QUESTION} onClick={this.eventButtonPasswordClick}/>
        </div>
        <Button loading={flag_loading} onClick={this.submit}>Submit</Button>
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
  private readonly eventInputPasswordChange = (password: string) => this.setState({password});

  // TODO: Check this

  private readonly eventButtonEmailClick = () => {
    this.setState({
      dialog: Dialog.show(
        <div className={Style.DialogContent}>
          <TitleText>Can't log in with your email?</TitleText>
          <p>To log in, please enter your email in this field. This is not your username.</p>
          <p>If your email and password is not accepted, please check that you've spelled your email and password correctly.</p>
          <p>If you think you have forgotten your password, please use the password help dialog, below the email help dialog (the button you pressed to show this text).</p>
        </div>,
      ),
    });
  };

  private readonly eventButtonPasswordClick = () => {
    this.setState({
      dialog: Dialog.show(
        <div className={Style.DialogContent}>
          <TitleText>Can't log in with your password?</TitleText>
          <p>We allow for emails and passwords to be changed, so please make sure you haven't changed either recently.</p>
          <p>If you're not sure if you're using the right password, or if you've forgotten your password, please use the form below to reset it.</p>
          <p/>
          <PasswordResetRequestForm/>
        </div>,
      ),
    });
  };
}

export interface LogInFormProps {
  className?: string
}

interface State {
  dialog?: string

  flag_loading: boolean
  field_errors: Partial<Record<keyof Omit<State, "flag_loading" | "error" | "field_errors">, Error>>
  error?: Error

  email: string
  password: string
}
