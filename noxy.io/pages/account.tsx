import {AxiosResponse} from "axios";
import _ from "lodash";
import Moment from "moment";
import {NextPageContext} from "next";
import React from "react";
import Order from "../../common/enums/Order";
import PermissionLevel from "../../common/enums/PermissionLevel";
import RequestHeader from "../../common/enums/RequestHeader";
import Dialog from "../components/Application/Dialog";
import {Masquerade} from "../components/Application/Masquerade";
import Button from "../components/Form/Button";
import Checkbox, {CheckboxCollection} from "../components/Form/Checkbox";
import Input from "../components/Form/Input";
import {SortableCollection} from "../components/Form/Sortable";
import Copy from "../components/Table/Copy";
import DataTable, {DataTableFilter} from "../components/Table/DataTable";
import ColumnText from "../components/Text/ColumnText";
import ErrorText from "../components/Text/ErrorText";
import HeaderText from "../components/Text/HeaderText";
import PageHeader from "../components/UI/PageHeader";
import Redirect from "../components/Application/Redirect";
import APIKeyEntity from "../entities/APIKeyEntity";
import UserEntity from "../entities/UserEntity";
import IconType from "../enums/IconType";
import InputType from "../enums/InputType";
import APIKeyCreateForm from "../forms/entities/APIKeyCreateForm";
import Style from "./account.module.scss";
import Component from "../components/Application/Component";

// noinspection JSUnusedGlobalSymbols
export default class AccountPage extends Component<AccountPageProps, State> {

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): AccountPageProps {
    const page = (context.query[AccountPageQuery.page] ?? "");
    const size = (context.query[AccountPageQuery.size] ?? "");
    const order = (context.query[AccountPageQuery.order] ?? []);

    return {
      [AccountPageQuery.page]:  +(Array.isArray(page) ? page[0] : page) || 1,
      [AccountPageQuery.size]:  +(Array.isArray(size) ? size[0] : size) || DataTable.defaultPageSize[0],
      [AccountPageQuery.order]: _.reduce(_.concat(order), (result, value) => _.set(result, value.replace(/^-/, ""), value[0] === "-" ? Order.ASC : Order.DESC), {}),
    };
  }

  constructor(props: AccountPageProps) {
    super(props);

    console.log(props);

    this.state = {
      loading: false,

      email:    "",
      username: "",
      password: "",
      confirm:  "",

      data:  [],
      page:  +(Array.isArray(props.page) ? props.page[0] : props.page) || 1,
      size:  +(Array.isArray(props.size) ? props.size[0] : props.size) || 1 || DataTable.defaultPageSize[0],
      order: {
        id:                   {order: props.order["id"], text: "ID", icon: IconType.ID},
        limit_per_decasecond: {order: props.order["limit_per_decasecond"], text: "Limit/10 sec", icon: IconType.GEAR},
        limit_per_minute:     {order: props.order["limit_per_minute"], text: "Limit/60 sec", icon: IconType.GEARS},
        time_created:         {order: _.size(props.order) ? props.order["time_created"] : Order.DESC, text: "Creation date", icon: IconType.CLOCK},
      },
    };
  }

  public readonly change = (filter: Filter) => {
    const size = filter.size ?? this.state.size;
    const page = filter.page ?? this.state.page;
    const order = filter.order ?? this.state.order;

    this.setState({size, page, order});
  };

  public readonly search = () => {
    const {order, page, size} = this.state;
    const user = this.context.state.masquerade ?? this.context.state.user;
    const list = [...user?.api_key_list ?? []];
    const key = _.findKey(order, item => item.order !== undefined) as keyof SortableCollection<SortKeys>;

    if (key && order[key] !== undefined && order[key].order) {
      list.sort((prev, next) => {
        if (prev[key] === next[key]) return 0;
        return prev[key] < next[key] && order[key].order === Order.ASC || prev[key] > next[key] && order[key].order === Order.DESC ? 1 : -1;
      });
    }

    const data = list.slice(size * (page - 1), size * page);
    this.setState({data, page, size, order});
  };

  public readonly create = () => {
    this.setState({dialog: Dialog.show(<APIKeyCreateForm onSubmit={this.eventAPIKeyFormCreateSubmit}/>)});
  };

  public readonly delete = async (user: string | UserEntity) => {
    const id = user instanceof UserEntity ? user.id : user;
    await APIKeyEntity.delete(id);
    this.search();
  };

  public readonly select = async (token: string) => {
    localStorage.setItem(RequestHeader.AUTHORIZATION, token);
    await this.context.refreshLogIn();
  };

  public componentDidMount = async () => {
    const user = this.context.state.masquerade ?? this.context.state.user;
    this.setState({email: user?.email ?? "", username: user?.username ?? ""});
  };

  public render() {
    const user = this.context.state.masquerade ?? this.context.state.user;
    const email_disabled = !this.state.email || user?.email === this.state.email;
    const username_disabled = !this.state.username || user?.username === this.state.username;
    const password_disabled = !this.state.password || !this.state.confirm || this.state.password !== this.state.confirm;

    return (
      <div className={Style.Component}>

        <PageHeader title={"My Account"}>
          <Masquerade key={1} className={Style.Masquerade} onChange={this.eventMasqueradeCommit}/>
          <Button className={Style.LogOut} onClick={this.context.performLogOut}>Log Out</Button>
        </PageHeader>

        <div className={Style.Main}>
          <div className={Style.Bubble}>
            <HeaderText>Update your email address</HeaderText>
            {this.renderBubbleEmailError()}
            <Input className={Style.BubbleInput} type={InputType.TEXT} value={this.state.email} label={"New email"} autoComplete={"email"} onChange={this.eventBubbleInputEmailChange}/>
            <Button disabled={email_disabled} onClick={this.eventBubbleEmailSubmit}>Change Email</Button>
          </div>

          <div className={Style.Bubble}>
            <HeaderText>Update your username</HeaderText>
            {this.renderBubbleUsernameError()}
            <Input className={Style.BubbleInput} type={InputType.EMAIL} value={this.state.username} label={"New username"} autoComplete={"username"} onChange={this.eventBubbleInputUsernameChange}/>
            <Button disabled={username_disabled} onClick={this.eventBubbleUsernameSubmit}>Change Username</Button>
          </div>

          <div className={Style.Bubble}>
            <HeaderText>Update your password</HeaderText>
            {this.renderBubblePasswordError()}
            <Input className={Style.BubbleInput} type={InputType.PASSWORD} value={this.state.password} label={"New password"} autoComplete={"new-password"}
                   onChange={this.eventPasswordChange}/>
            <Input className={Style.BubbleInput} type={InputType.PASSWORD} value={this.state.confirm} label={"Confirm password"} autoComplete={"new-password"}
                   onChange={this.eventConfirmChange}/>
            <Button disabled={password_disabled} onClick={this.eventPasswordSubmit}>Change Password</Button>
          </div>

          <div className={Style.Bubble}>
            <HeaderText>Account info</HeaderText>
            <div className={Style.BubbleTable}>
              <div className={Style.BubbleTableHeader}>
                <span>ID:</span>
                <span>Creation date:</span>
              </div>
              <div className={Style.BubbleTableText}>
                <span>{user?.id}</span>
                <span>{Moment(user?.time_created).format("DD-MM-YYYY HH:mm:ss")}</span>
              </div>
            </div>
          </div>
        </div>

        {this.renderDataTable()}
      </div>
    );
  }

  private readonly renderBubbleEmailError = () => {
    if (!this.state.email_error) return null;
    return (
      <ErrorText>{this.state.email_error.message}</ErrorText>
    );
  };

  private readonly renderBubbleUsernameError = () => {
    if (!this.state.username_error) return null;
    return (
      <ErrorText>{this.state.username_error.message}</ErrorText>
    );
  };

  private readonly renderBubblePasswordError = () => {
    if (!this.state.password_error) return null;
    return (
      <ErrorText>{this.state.password_error.message}</ErrorText>
    );
  };

  private readonly renderDataTable = () => {
    if (!this.context.hasPermission(PermissionLevel.API_KEY_VIEW)) return null;

    const {page, size, order} = this.state;
    const count = this.context.state.user?.api_key_list.length ?? 0;
    const onCreate = this.context.hasPermission(PermissionLevel.API_KEY_CREATE) ? this.create : undefined;

    return (
      <div className={Style.Footer}>
        <PageHeader title={"API Keys"}/>
        <DataTable className={Style.Table} page={page} size={size} count={count} order={order}
                   onCreate={onCreate} onChange={this.change} onSearch={this.search}>
          {_.map(this.state.data, this.renderTableRow)}
        </DataTable>
      </div>
    );
  };


  private readonly renderTableRow = (entity: APIKeyEntity, index: number) => {
    const {masquerade, user} = this.context.state;
    if (!user) return null;

    const api_key = user.getCurrentAPIKey();
    const select = {[api_key.id]: {value: entity.token, checked: entity.token === api_key.token, disabled: masquerade && masquerade?.id !== user.id}};
    const delete_disabled = !this.context.hasPermission(PermissionLevel.API_KEY_DELETE) || entity.isAdmin() || this.state.data.length === 1;

    return (
      <div key={index} className={Style.Content}>
        <Checkbox className={Style.APIKey} onChange={this.eventCheckboxChange}>{select}</Checkbox>
        <ColumnText className={Style.LimitDecasecond} title={"Rate limit per 10 seconds"}>{entity.limit_per_decasecond}</ColumnText>
        <ColumnText className={Style.LimitMinute} title={"Rate limit per 60 seconds"}>{entity.limit_per_minute}</ColumnText>
        <Copy className={Style.Token} title={"Token"}>{entity.token}</Copy>
        <ColumnText className={Style.TimeCreated} title={"Created at"}>{Moment(entity.time_created).format("DD-MM-YYYY HH:mm:ss")}</ColumnText>
        <div className={Style.ActionList}>
          <Redirect href={`/api-key/${entity.id}`}>
            <Button icon={IconType.EDIT}/>
          </Redirect>
          <Button icon={IconType.CLOSE} value={entity.id} disabled={delete_disabled} onClick={this.delete}/>
        </div>
      </div>
    );
  };

  private readonly eventBubbleInputEmailChange = (email: string) => this.setState({email});
  private readonly eventBubbleEmailSubmit = async () => {
    try {
      await this.context.updateLogIn(this.context.state.masquerade?.id ?? this.context.state.user?.id!, {email: this.state.email});
    }
    catch (error) {
      const response = error.response as AxiosResponse<APIRequest<unknown>>;
      if (response?.status === 400) {
        this.setState({email_error: new Error("Email is invalid")});
      }
      else {
        this.setState({email_error: new Error("Unexpected server error occurred")});
      }
    }
  };

  private readonly eventBubbleInputUsernameChange = (username: string) => this.setState({username});
  private readonly eventBubbleUsernameSubmit = async () => {
    try {
      await this.context.updateLogIn(this.context.state.masquerade?.id ?? this.context.state.user?.id!, {username: this.state.username});
    }
    catch (error) {
      const response = error.response as AxiosResponse<APIRequest<unknown>>;
      if (response?.status === 400) {
        this.setState({username_error: new Error("Username must be between 3 and 64 characters")});
      }
      else {
        this.setState({username_error: new Error("Unexpected server error occurred")});
      }
    }
  };

  private readonly eventPasswordChange = (password: string) => this.setState({password});
  private readonly eventConfirmChange = (confirm: string) => this.setState({confirm});

  private readonly eventPasswordSubmit = async () => {
    try {
      // Raise notification
      await this.context.updateLogIn(this.context.state.masquerade?.id ?? this.context.state.user?.id!, {password: this.state.password});
      this.setState({password: "", confirm: ""});
    }
    catch (error) {
      const response = error.response as AxiosResponse<APIRequest<unknown>>;
      if (response?.status === 400) {
        this.setState({password_error: new Error("Password must be at least 12 characters.")});
      }
      else {
        this.setState({password_error: new Error("Unexpected server error occurred")});
      }
    }
  };

  private readonly eventAPIKeyFormCreateSubmit = (value: APIKeyEntity) => {
    Dialog.close(this.state.dialog);
    return value.user?.getPrimaryID() === this.context.state.user?.getPrimaryID() ? this.context.refreshLogIn() : this.search();
  };

  private readonly eventCheckboxChange = (value: CheckboxCollection<{[key: string]: string}>) => this.select(_.values(value)[0].value);

  private readonly eventMasqueradeCommit = ({email, username}: UserEntity) => {
    this.search();
    this.setState({email, username});
  };

}

enum AccountPageQuery {
  page = "page",
  size = "size",
  order = "order",
}

type SortKeys = "id" | "limit_per_decasecond" | "limit_per_minute" | "time_created"
type Filter = Pick<DataTableFilter<SortKeys>, "size" | "page" | "order">;

export interface AccountPageProps {
  [AccountPageQuery.page]: number
  [AccountPageQuery.size]: number
  [AccountPageQuery.order]: {[key: string]: Order | undefined}
}

interface State {
  dialog?: string
  loading: boolean

  email: string
  email_error?: Error
  username: string
  username_error?: Error
  password: string
  confirm: string
  password_error?: Error

  data: APIKeyEntity[];
  page: number
  size: number
  order: SortableCollection<SortKeys>
}
