import _ from "lodash";
import React from "react";
import Permission from "../../../common/classes/Permission";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import Tickable, {TickableCollection} from "../../components/Form/Tickable";
import Global from "../../Global";
import Style from "./PermissionExplorer.module.scss";

export default class PermissionExplorer extends React.Component<PermissionExplorerProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  constructor(props: PermissionExplorerProps) {
    super(props);

    this.state = {
      loading:      false,
      field_errors: {},
    };
  }

  public readonly setPermission = (permission: PermissionLevel, value: boolean) => {
    this.props.onChange(new Permission(_.set({...this.props.permission} as Permission, permission, value)));
  };

  private readonly getTickableItem = (text: string, value: PermissionLevel) => {
    return {text, value, checked: this.isChecked(value), disabled: this.isDisabled(value)};
  };

  private readonly isChecked = (permission: PermissionLevel) => {
    return this.props.permission[permission];
  };

  private readonly isDisabled = (permission: PermissionLevel) => {
    return this.props.permission[PermissionLevel.ADMIN] || !this.context.hasPermission(PermissionLevel.API_KEY_UPDATE) || !this.context.hasPermission(permission);
  };

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        {this.renderAdminSection()}
        {this.renderUserSection()}
        {this.renderAPIKeySection()}
        {this.renderFileSection()}
        {this.renderFileTagSection()}
      </div>
    );
  }

  private readonly renderAdminSection = () => {
    if (!this.props.permission[PermissionLevel.ADMIN]) return null;

    return (
      <div className={Style.Admin}>
        <div className={Style.Header}>
          <Tickable className={Style.Checkbox} onChange={_.noop}>
            {{admin: {text: "Administrator", value: null, checked: true, disabled: true}}}
          </Tickable>
        </div>
        <p>Grants full permission to any and all API functionalities. Having administrator level permission overrules all other permission levels.</p>
        <p><b>Administrator rights can never be granted or removed outside of accessing the database.</b></p>
      </div>
    );
  };

  private readonly renderUserSection = () => {
    if (!this.context.hasPermission(PermissionLevel.USER)) return null;

    return (
      <div className={Style.Section}>
        <div className={Style.Header}>
          <Tickable className={Style.Checkbox} onChange={this.eventTickableChange}>
            {{[PermissionLevel.USER]: this.getTickableItem("User management", PermissionLevel.USER)}}
          </Tickable>
        </div>
        <div className={Style.Item}>
          <Tickable className={Style.Checkbox} onChange={this.eventTickableChange}>
            {{[PermissionLevel.USER]: this.getTickableItem("Masquerade", PermissionLevel.USER_MASQUERADE)}}
          </Tickable>
          <p>Allows a user to access the data of another user. however any actions performed as that user will be logged as if performed by the masquerading user.</p>
          <b>Any action performed while masquerading will be logged as if having been performed by your own user.</b>
        </div>
        <div className={Style.Item}>
          <Tickable className={Style.Checkbox} onChange={this.eventTickableChange}>
            {{[PermissionLevel.USER]: this.getTickableItem("Elevated access", PermissionLevel.USER_ELEVATED)}}
          </Tickable>
          <p>Allows a user to access high risk data and to change other users data without masquerading as them.</p>
          <b>Performing changes as an elevated user is both logged and performed as coming from your user.</b>
        </div>
      </div>
    );
  };

  private readonly renderAPIKeySection = () => {
    if (!this.context.hasPermission(PermissionLevel.API_KEY)) return null;

    return (
      <div className={Style.Section}>
        <div className={Style.Header}>
          <Tickable className={Style.Checkbox} onChange={this.eventTickableChange}>
            {{[PermissionLevel.API_KEY]: this.getTickableItem("API Key management", PermissionLevel.API_KEY)}}
          </Tickable>
        </div>
        <div className={Style.Item}>
          <Tickable className={Style.Checkbox} onChange={this.eventTickableChange}>
            {{[PermissionLevel.API_KEY]: this.getTickableItem("View API key permissions", PermissionLevel.API_KEY_VIEW)}}
          </Tickable>
          <p>Allows a user to see the API Key management page for API Keys attached to their account.</p>
        </div>
        <div className={Style.Item}>
          <Tickable className={Style.Checkbox} onChange={this.eventTickableChange}>
            {{[PermissionLevel.API_KEY]: this.getTickableItem("Create new API keys", PermissionLevel.API_KEY_CREATE)}}
          </Tickable>
          <p>Allows creation of new API Keys to be attached to the account.</p>
        </div>
        <div className={Style.Item}>
          <Tickable className={Style.Checkbox} onChange={this.eventTickableChange}>
            {{[PermissionLevel.API_KEY]: this.getTickableItem("Update existing API keys", PermissionLevel.API_KEY_UPDATE)}}
          </Tickable>
          <p>Allows updating of the rate limits and permissions for an API Key.</p>
          <b>It is impossible to grant a permission you don't have yourself.</b>
        </div>
        <div className={Style.Item}>
          <Tickable className={Style.Checkbox} onChange={this.eventTickableChange}>
            {{[PermissionLevel.API_KEY]: this.getTickableItem("Delete existing API keys", PermissionLevel.API_KEY_DELETE)}}
          </Tickable>
          <p>Allows deletion of existing API keys.</p>
          <b>It is impossible to delete the last API Key of an account.</b>
        </div>
      </div>
    );
  };

  private readonly renderFileSection = () => {
    if (!this.context.hasPermission(PermissionLevel.FILE)) return null;

    return (
      <div className={Style.Section}>
        <div className={Style.Header}>
          <Tickable className={Style.Checkbox} onChange={this.eventTickableChange}>
            {{[PermissionLevel.FILE]: this.getTickableItem("File management", PermissionLevel.FILE)}}
          </Tickable>
        </div>
        <div className={Style.Item}>
          <Tickable className={Style.Checkbox} onChange={this.eventTickableChange}>
            {{[PermissionLevel.FILE]: this.getTickableItem("Upload file(s) to My Files", PermissionLevel.FILE_CREATE)}}
          </Tickable>
          <p>Allows a user to upload files to their account.</p>
        </div>
      </div>
    );
  };

  private readonly renderFileTagSection = () => {
    if (!this.context.hasPermission(PermissionLevel.FILE_TAG)) return null;

    return (
      <div className={Style.Section}>
        <div className={Style.Header}>
          <Tickable className={Style.Checkbox} onChange={this.eventTickableChange}>
            {{[PermissionLevel.FILE]: this.getTickableItem("File tag management", PermissionLevel.FILE_TAG)}}
          </Tickable>
        </div>
        <div className={Style.Item}>
          <Tickable className={Style.Checkbox} onChange={this.eventTickableChange}>
            {{[PermissionLevel.FILE]: this.getTickableItem("Create file tag(s)", PermissionLevel.FILE_TAG_CREATE)}}
          </Tickable>
          <p>Allows a user to create new file tags, attached to their account.</p>
        </div>
      </div>
    );
  };

  private readonly eventTickableChange = (tickable_collection: TickableCollection<PermissionLevel>) => {
    const permission = {...this.props.permission} as Permission;
    for (let category in tickable_collection) {
      if (!tickable_collection.hasOwnProperty(category)) continue;
      const {value, checked} = tickable_collection[category];
      _.set(permission, value, checked);
    }
    this.props.onChange(new Permission(permission));
  };
}

export interface PermissionExplorerProps {
  permission: Permission

  className?: string

  onChange: (permission: Permission) => void
}

interface State {
  loading: boolean

  error?: Error
  field_errors: Partial<Record<keyof Omit<State, "loading" | "error" | "field_errors">, Error>>
}
