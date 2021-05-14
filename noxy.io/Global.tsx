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
      if (masquerade && masquerade?.id !== this.state.user?.id) {
        Axios.defaults.headers.common[RequestHeader.MASQUERADE] = masquerade.id;
        localStorage[RequestHeader.MASQUERADE] = masquerade.id;
        this.setState({masquerade});
      }
      else {
        delete Axios.defaults.headers.common[RequestHeader.MASQUERADE];
        delete localStorage[RequestHeader.MASQUERADE];
        this.setState({masquerade: undefined});
      }
    };

    public hasAnyPermission = (...permission_list: PermissionLevel[]) => {
      return this.state.user?.hasAnyPermission(...permission_list) ?? false;
    };

    public hasPermission = (...permission_list: PermissionLevel[]) => {
      return this.state.user?.hasPermission(...permission_list) ?? false;
    };

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

      if (localStorage[RequestHeader.MASQUERADE]) {
        Axios.defaults.headers.common[RequestHeader.MASQUERADE] = localStorage[RequestHeader.MASQUERADE];
        this.setState({masquerade: await UserEntity.findOneByID(localStorage[RequestHeader.MASQUERADE])});
      }

      try {
        return this.assignUser(await UserEntity.logIn());
      }
      catch (error) {
        this.performLogOut();
      }
    };

    public performLogOut = () => {
      delete localStorage[RequestHeader.MASQUERADE];
      delete localStorage[RequestHeader.AUTHORIZATION];
      delete Axios.defaults.headers.common[RequestHeader.AUTHORIZATION];
      Router.reload();
    };

    public updateLogIn = async (id: string, params: Parameters<typeof UserEntity["put"]>["1"]) => {
      return this.assignUser(await UserEntity.put(id, params));
    };

    private assignUser = (user: UserEntity) => {
      const api_key = user.getCurrentAPIKey();
      if (!api_key) throw new FatalException("User has no API Key", "A user must be granted an API Key.");

      const next_state = {} as State;
      next_state.loading = false;
      next_state.user = user;

      Axios.defaults.headers.common[RequestHeader.AUTHORIZATION] = api_key.token;
      localStorage.setItem(RequestHeader.AUTHORIZATION, api_key.token);

      this.setState(next_state);
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

