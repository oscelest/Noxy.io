import {AxiosError} from "axios";
import IsEmail from "isemail";
import _ from "lodash";
import React from "react";
import Component from "../components/Application/Component";
import Dialog from "../components/Application/Dialog";
import Form from "../components/Base/Form";
import Button from "../components/Form/Button";
import Input from "../components/Form/Input";
import TitleText from "../components/Text/TitleText";
import IconType from "../enums/IconType";
import InputType from "../enums/InputType";
import Style from "./LogInForm.module.scss";
import PasswordResetRequestForm from "./PasswordResetRequestForm";
import ServerException from "../../common/exceptions/ServerException";

export default class LogInForm extends Component<LogInFormProps, State> {
  
  constructor(props: LogInFormProps) {
    super(props);
    this.state = {
      loading:      false,
      field_errors: {},
      
      email:    "",
      password: "",
    };
  }
  
  public readonly submit = async () => {
    const {email, password} = this.state;
    const next_state = {field_errors: {}} as State;
    
    if (!email.length) {
      next_state.field_errors.email = new Error("Please enter your email");
    }
    else if (!IsEmail.validate(email)) {
      next_state.field_errors.email = new Error("Email address is invalid");
    }
    
    if (!password.length) {
      next_state.field_errors.password = new Error("Please enter your password");
    }
    else if (password.length < 12) {
      next_state.field_errors.password = new Error("Password is too short");
    }
    
    if (!_.size(next_state.field_errors)) {
      next_state.loading = true;
      try {
        this.setState(next_state);
        await this.context.performLogIn(email, password);
        next_state.error = undefined;
      }
      catch (error) {
        console.log(error);
        const {content} = error as ServerException;
        
        if (response?.status === 400) {
          next_state.error = new Error("Incorrect email and/or password");
        }
        else if (response?.status === 404) {
          next_state.error = new Error("Email does not exist");
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
    const {email, password, loading, error, field_errors} = this.state;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <Form className={classes.join(" ")} loading={loading} error={error} onSubmit={this.submit}>
        <div className={Style.Wrapper}>
          <Input className={Style.Input} type={InputType.EMAIL} label={"Email"} value={email} error={field_errors.email} autoComplete={"username"} onChange={this.eventInputEmailChange}/>
          <Button icon={IconType.QUESTION} onClick={this.eventButtonEmailClick}/>
        </div>
        <div className={Style.Wrapper}>
          <Input className={Style.Input} type={InputType.PASSWORD} label={"Password"} value={password} error={field_errors.password} autoComplete={"password"}
                 onChange={this.eventInputPasswordChange}/>
          <Button icon={IconType.QUESTION} onClick={this.eventButtonPasswordClick}/>
        </div>
      </Form>
    
    );
  }
  
  private readonly eventInputEmailChange = (email: string) => {
    this.setState({email});
  };
  
  private readonly eventInputPasswordChange = (password: string) => {
    this.setState({password});
  };
  
  private readonly eventButtonEmailClick = () => {
    this.setState({
      dialog: Dialog.show(
        <div className={Style.DialogContent}>
          <p>To log in, please enter your email in this field. This is not your username.</p>
          <p>If your email and password is not accepted, please check that you've spelled your email and password correctly.</p>
          <p>If you think you have forgotten your password, please use the password help dialog, below the email help dialog (the button you pressed to show this text).</p>
        </div>,
        {title: "Can't log in with your email?"},
      ),
    });
  };
  
  private readonly eventButtonPasswordClick = () => {
    this.setState({
      dialog: Dialog.show(
        <div className={Style.DialogContent}>
          <p>We allow for emails and passwords to be changed, so please make sure you haven't changed either recently.</p>
          <p>If you're not sure if you're using the right password, or if you've forgotten your password, please use the form below to reset it.</p>
          <TitleText>Reset password</TitleText>
          <PasswordResetRequestForm className={Style.PasswordResetForm}/>
        </div>,
        {title: "Can't log in with your password?"},
      ),
    });
  };
}

export interface LogInFormProps {
  className?: string;
  onSubmit?(): void;
}

interface State {
  dialog?: string;
  
  loading: boolean;
  error?: Error;
  field_errors: Partial<Record<keyof Omit<State, "loading" | "error" | "field_errors">, Error>>;
  
  email: string;
  password: string;
}
