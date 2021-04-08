import Axios from "axios";
import _ from "lodash";
import Router from "next/router";
import React from "react";
import PermissionLevel from "../common/enums/PermissionLevel";
import RequestHeader from "../common/enums/RequestHeader";
import UserEntity from "./entities/UserEntity";
import FatalException from "./exceptions/FatalException";

namespace Global {

  export const Context = React.createContext({});

  export class Provider extends React.Component<Props, State> {

    constructor(props: Props) {
      super(props);
      this.state = {
        loading: false,
      };
    }

    public masquerade = (masquerade?: UserEntity) => {
      if (!masquerade || masquerade?.id === this.state.user?.id) {
        delete Axios.defaults.headers.common[RequestHeader.MASQUERADE];
        this.setState({masquerade: undefined});
      }
      else {
        Axios.defaults.headers.common[RequestHeader.MASQUERADE] = masquerade.id;
        this.setState({masquerade});
      }
    };

    public hasPermission = (permission: PermissionLevel) => {
      return this.state.user?.hasPermission(permission) ?? false
    }

    public performSignUp = async (email: string, username: string, password: string) => {
      return this.assignUser(await UserEntity.create({email, username, password}));
    };

    public performLogIn = async (email: string, password: string) => {
      return this.assignUser(await UserEntity.logIn({email, password}));
    };

    public refreshLogIn = async () => {
      const jwt = localStorage[RequestHeader.AUTHORIZATION];
      if (!jwt) throw new FatalException("Could not refresh login", "No JSONWebToken present in Local Storage.");

      this.setState({loading: true});
      Axios.defaults.headers.common[RequestHeader.AUTHORIZATION] = jwt;

      try {
        return this.assignUser(await UserEntity.logIn());
      }
      catch (error) {
        this.performLogOut();
      }
    };

    public performLogOut = () => {
      localStorage.removeItem(RequestHeader.AUTHORIZATION);
      delete Axios.defaults.headers.common[RequestHeader.AUTHORIZATION];
      Router.reload();
    };

    public updateLogIn = async (id: string, params: Parameters<typeof UserEntity["put"]>["1"]) => {
      return this.assignUser(await UserEntity.put(id, params));
    };

    private assignUser = (user: UserEntity) => {
      const next_state = {} as State;

      next_state.loading = false;
      if (!this.state.masquerade) {
        const api_key = user.getCurrentAPIKey();
        if (!api_key) throw new FatalException("User has no API Key", "A user must be granted an API Key.");
        next_state.user = user;

        Axios.defaults.headers.common[RequestHeader.AUTHORIZATION] = api_key.token;
        localStorage.setItem(RequestHeader.AUTHORIZATION, api_key.token);
      }
      else {
        next_state.masquerade = user;
      }

      setTimeout(() => this.setState(next_state));
      return user;
    };

    public componentDidMount = async () => {
      if (localStorage[RequestHeader.AUTHORIZATION]) await this.refreshLogIn();
    };

    public render = () => {
      return (
        <Global.Context.Provider value={_.merge({}, this)}>
          {this.props.children}
        </Global.Context.Provider>
      );
    };
  }

  export type Context = Provider;
}

interface Props {

}

interface State {
  loading: boolean
  user?: UserEntity
  masquerade?: UserEntity
}

export default Global;

