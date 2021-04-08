import {NextPageContext} from "next";
import React from "react";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import Loader from "../../components/UI/Loader";
import PageHeader from "../../components/UI/PageHeader";
import Placeholder from "../../components/UI/Placeholder";
import APIKeyEntity from "../../entities/APIKeyEntity";
import Size from "../../enums/Size";
import APIKeyUpdateForm from "../../forms/entities/APIKeyUpdateForm";
import Global from "../../Global";
import Style from "./[id].module.scss";

// noinspection JSUnusedGlobalSymbols
export default class APIKeyIDPage extends React.Component<APIKeyIDPageProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): APIKeyIDPageProps {
    const id = (context.query[APIKeyIDPageQuery.ID] ?? "");

    return {
      [APIKeyIDPageQuery.ID]: (Array.isArray(id) ? id[0] : id) || "",
      permission: PermissionLevel.API_KEY_VIEW
    };
  }

  constructor(props: APIKeyIDPageProps) {
    super(props);
    this.state = {
      loading: true,
    };
  }

  public async componentDidMount() {
    if (!this.state.api_key && this.context.state.user) {
      this.setState({loading: false, api_key: await APIKeyEntity.getByID(this.props.id)});
    }
  }

  public render() {
    return (
      <Loader size={Size.LARGE} show={this.state.loading}>
        <Placeholder show={!this.state.api_key} text={"API Key with this ID does not exist or you do not have the authority to view it."}>
          <div className={Style.Component}>
            <PageHeader title={`Manage API Key for ${this.state.api_key?.user?.email} (ID: ${this.state.api_key?.id})`}/>
            {this.renderForm()}
          </div>
        </Placeholder>
      </Loader>
    );
  }

  private readonly renderForm = () => {
    if (!this.state.api_key) return null;

    return (
      <APIKeyUpdateForm entity={this.state.api_key}/>
    );
  };
}

enum APIKeyIDPageQuery {
  ID = "id",
}

interface APIKeyIDPageProps extends PageProps {
  [APIKeyIDPageQuery.ID]: string
}

interface State {
  api_key?: APIKeyEntity
  loading: boolean
}
