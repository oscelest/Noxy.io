import {AxiosError} from "axios";
import IsEmail from "isemail";
import _ from "lodash";
import React from "react";
import Component from "../components/Application/Component";
import Form from "../components/Base/Form";
import Input from "../components/Form/Input";
import InputType from "../enums/InputType";
import Style from "./SignUpForm.module.scss";

export default class LogInForm extends Component<SignUpFormProps, State> {
  
  constructor(props: SignUpFormProps) {
    super(props);
    this.state = {
      email:    "",
      username: "",
      password: "",
      confirm:  "",
      
      loading:      false,
      field_errors: {},
    };
  }
  
  public readonly submit = async () => {
    const {email, username, password, confirm} = this.state;
    const next_state = {error: undefined, field_errors: {}} as State;
    
    if (!email.length) {
      next_state.field_errors.email = new Error();
    }
    else if (!IsEmail.validate(email)) {
      next_state.field_errors.email = new Error("Please enter a valid email");
    }
    
    if (!username.length) {
      next_state.field_errors.username = new Error();
    }
    else if (username.length < 3 || username.length > 32) {
      next_state.field_errors.username = new Error("Must be 3-32 characters");
    }
    
    if (!password.length) {
      next_state.field_errors.password = new Error();
    }
    else if (password.length < 12) {
      next_state.field_errors.password = new Error("Must contain at least 12 chars");
    }
    
    if (!confirm.length) {
      next_state.field_errors.confirm = new Error();
    }
    else if (password !== confirm) {
      next_state.field_errors.confirm = new Error("Does not match");
    }
    
    if (!_.size(next_state.field_errors)) {
      next_state.loading = true;
      try {
        this.setState(next_state);
        await this.context.performSignUp(email, username, password);
        await this.props.onSubmit?.(email, username, password);
      }
      catch (error) {
        const {response} = error as AxiosError<APIResponse<unknown>>;
        
        if (response?.status === 400) {
          next_state.error = new Error("Email and password does not match any account");
        }
        if (response?.status === 409) {
          next_state.error = new Error("Email is already registered.");
        }
        else {
          next_state.error = new Error("Unexpected server error occurred.");
        }
      }
      finally {
        next_state.loading = false;
        this.setState(next_state);
      }
    }
    else {
      this.setState(next_state);
    }
  };
  
  public render() {
    const {email, username, password, confirm, loading, error, field_errors} = this.state;
    
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <Form className={classes.join(" ")} focus={false} loading={loading} error={error} onSubmit={this.submit}>
        <Input type={InputType.EMAIL} label={"Email"} value={email} error={field_errors.email} onChange={this.eventInputEmailChange}/>
        <Input type={InputType.TEXT} label={"Username"} value={username} error={field_errors.username} onChange={this.eventInputUsernameChange}/>
        <Input type={InputType.PASSWORD} label={"Password"} value={password} error={field_errors.password} onChange={this.eventInputPasswordChange}/>
        <Input type={InputType.PASSWORD} label={"Re-enter password"} value={confirm} error={field_errors.confirm} onChange={this.eventInputConfirmChange}/>
      </Form>
    );
  }
  
  private readonly eventInputEmailChange = (email: string) => {
    this.setState({email});
  };
  
  private readonly eventInputUsernameChange = (username: string) => {
    this.setState({username});
  };
  
  private readonly eventInputPasswordChange = (password: string) => {
    this.setState({password});
  };
  
  private readonly eventInputConfirmChange = (confirm: string) => {
    this.setState({confirm});
  };
}

export interface SignUpFormProps {
  className?: string;
  onSubmit?(email: string, username: string, password: string): void;
}

interface State {
  email: string;
  username: string;
  password: string;
  confirm: string;
  
  loading: boolean;
  error?: Error;
  field_errors: Partial<Record<keyof Omit<State, "loading" | "error" | "field_errors">, Error>>;
}
