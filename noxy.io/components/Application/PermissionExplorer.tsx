import _ from "lodash";
import React from "react";
import Permission from "../../../common/classes/Permission";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import Checkbox, {CheckboxCollection} from "../../components/Form/Checkbox";
import Global from "../../Global";
import Style from "./PermissionExplorer.module.scss";
import Conditional from "./Conditional";

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

  private readonly getCheckboxItem = (text: string, value: PermissionLevel) => {
    return {text, value, checked: this.isChecked(value), disabled: this.isDisabled(value)};
  };

  private readonly isChecked = (permission: PermissionLevel) => {
    return this.props.permission[permission];
  };

  private readonly isDisabled = (permission: PermissionLevel) => {
    if (!this.context.hasAnyPermission(PermissionLevel.ADMIN, PermissionLevel.API_KEY_UPDATE, permission)) return true;
    if (this.props.permission[PermissionLevel.ADMIN] && this.context.state.masquerade?.id && this.context.state.user?.id !== this.context.state.masquerade?.id) return true;
    return false;
  };

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>

        <Conditional condition={this.context.hasPermission(PermissionLevel.ADMIN)}>
          <div className={Style.Admin}>
            <div className={Style.Header}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.ADMIN]: this.getCheckboxItem("Administration", PermissionLevel.ADMIN)}}
              </Checkbox>
            </div>
            <p>Grants full permission to any and all API functionalities. Having administrator level permission overrules all other permission levels.</p>
            <p><b>Administrator rights can never be granted or removed outside of accessing the database.</b></p>
          </div>
        </Conditional>

        <Conditional condition={this.context.hasAnyPermission(PermissionLevel.USER_ELEVATED, PermissionLevel.USER_MASQUERADE)}>
          <div className={Style.Section}>
            <div className={Style.Header}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.USER]: this.getCheckboxItem("User management", PermissionLevel.USER)}}
              </Checkbox>
            </div>
            <div className={Style.Item}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.USER]: this.getCheckboxItem("Masquerade", PermissionLevel.USER_MASQUERADE)}}
              </Checkbox>
              <p>Allows a user to access the data of another user. however any actions performed as that user will be logged as if performed by the masquerading user.</p>
              <b>Any action performed while masquerading will be logged as if having been performed by your own user.</b>
            </div>
            <div className={Style.Item}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.USER]: this.getCheckboxItem("Elevated access", PermissionLevel.USER_ELEVATED)}}
              </Checkbox>
              <p>Allows a user to access high risk data and to change other users data without masquerading as them.</p>
              <b>Performing changes as an elevated user is both logged and performed as coming from your user.</b>
            </div>
          </div>
        </Conditional>

        <Conditional condition={this.context.hasAnyPermission(PermissionLevel.API_KEY_VIEW, PermissionLevel.API_KEY_CREATE, PermissionLevel.API_KEY_UPDATE, PermissionLevel.API_KEY_DELETE)}>
          <div className={Style.Section}>
            <div className={Style.Header}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.API_KEY]: this.getCheckboxItem("API Key management", PermissionLevel.API_KEY)}}
              </Checkbox>
            </div>
            <div className={Style.Item}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.API_KEY]: this.getCheckboxItem("View API key permissions", PermissionLevel.API_KEY_VIEW)}}
              </Checkbox>
              <p>Allows a user to see the API Key management page for API Keys attached to their account.</p>
            </div>
            <div className={Style.Item}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.API_KEY]: this.getCheckboxItem("Create new API keys", PermissionLevel.API_KEY_CREATE)}}
              </Checkbox>
              <p>Allows creation of new API Keys to be attached to the account.</p>
            </div>
            <div className={Style.Item}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.API_KEY]: this.getCheckboxItem("Update existing API keys", PermissionLevel.API_KEY_UPDATE)}}
              </Checkbox>
              <p>Allows updating of the rate limits and permissions for an API Key.</p>
              <b>It is impossible to grant a permission you don't have yourself.</b>
            </div>
            <div className={Style.Item}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.API_KEY]: this.getCheckboxItem("Delete existing API keys", PermissionLevel.API_KEY_DELETE)}}
              </Checkbox>
              <p>Allows deletion of existing API keys.</p>
              <b>It is impossible to delete the last API Key of an account.</b>
            </div>
          </div>
        </Conditional>

        <Conditional condition={this.context.hasAnyPermission(PermissionLevel.FILE_CREATE, PermissionLevel.FILE_UPDATE, PermissionLevel.FILE_DELETE)}>
          <div className={Style.Section}>
            <div className={Style.Header}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.FILE]: this.getCheckboxItem("File management", PermissionLevel.FILE)}}
              </Checkbox>
            </div>
            <div className={Style.Item}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.FILE]: this.getCheckboxItem("Upload file(s) to My Files", PermissionLevel.FILE_CREATE)}}
              </Checkbox>
              <p>Allows a user to upload files to their account.</p>
            </div>
            <div className={Style.Item}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.FILE]: this.getCheckboxItem("Update file(s) in My Files", PermissionLevel.FILE_UPDATE)}}
              </Checkbox>
              <p>Allows a user to update files on their account.</p>
            </div>
            <div className={Style.Item}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.FILE]: this.getCheckboxItem("Delete file(s) from My Files", PermissionLevel.FILE_DELETE)}}
              </Checkbox>
              <p>Allows a user to delete files from their account.</p>
            </div>
          </div>
        </Conditional>

        <Conditional condition={this.context.hasAnyPermission(PermissionLevel.FILE_TAG_CREATE, PermissionLevel.FILE_TAG_DELETE)}>
          <div className={Style.Section}>
            <div className={Style.Header}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.FILE]: this.getCheckboxItem("File tag management", PermissionLevel.FILE_TAG)}}
              </Checkbox>
            </div>
            <div className={Style.Item}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.FILE]: this.getCheckboxItem("Create file tag(s)", PermissionLevel.FILE_TAG_CREATE)}}
              </Checkbox>
              <p>Allows a user to create new file tags attached to their account.</p>
            </div>
            <div className={Style.Item}>
              <Checkbox className={Style.Checkbox} onChange={this.eventCheckboxChange}>
                {{[PermissionLevel.FILE]: this.getCheckboxItem("Delete file tag(s)", PermissionLevel.FILE_TAG_DELETE)}}
              </Checkbox>
              <p>Allows a user to delete previously created file tags attached to their account.</p>
            </div>
          </div>
        </Conditional>

      </div>
    );
  }

  private readonly eventCheckboxChange = (checkbox_collection: CheckboxCollection<{[key: string]: PermissionLevel}>) => {
    const permission = {...this.props.permission} as Permission;
    for (let category in checkbox_collection) {
      if (!checkbox_collection.hasOwnProperty(category)) continue;
      const {value, checked} = checkbox_collection[category];
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
