import {NextPageContext} from "next";
import React from "react";
import PermissionLevel from "../../../common/enums/PermissionLevel";
import Size from "../../../common/enums/Size";
import Component from "../../components/Application/Component";
import Loader from "../../components/UI/Loader";
import PageHeader from "../../components/UI/PageHeader";
import Placeholder from "../../components/UI/Placeholder";
import APIKeyEntity from "../../entities/APIKeyEntity";
import APIKeyUpdateForm from "../../forms/entities/APIKeyUpdateForm";
import Style from "./[id].module.scss";

// noinspection JSUnusedGlobalSymbols
export default class APIKeyIDPage extends Component<APIKeyIDPageProps, State> {

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
      api_key: new APIKeyEntity(),
      loading: true,
    };
  }

  public async componentDidMount() {
    if (this.context.state.user) {
      this.setState({loading: false, api_key: await APIKeyEntity.getByID(this.props.id)});
    }
  }

  public render() {
    return (
      <Loader size={Size.LARGE} value={this.state.loading}>
        <Placeholder value={!this.state.api_key.exists() || "API Key with this ID does not exist or you do not have the authority to view it."}>
          <div className={Style.Component}>
            <PageHeader title={`Manage API Key for ${this.state.api_key.user?.email} (ID: ${this.state.api_key?.id})`}/>
            <APIKeyUpdateForm entity={this.state.api_key}/>
          </div>
        </Placeholder>
      </Loader>
    );
  }
}

enum APIKeyIDPageQuery {
  ID = "id",
}

interface APIKeyIDPageProps extends PageProps {
  [APIKeyIDPageQuery.ID]: string
}

interface State {
  api_key: APIKeyEntity
  loading: boolean
}
