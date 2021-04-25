import {NextPageContext} from "next";
import React from "react";
import Loader from "../../components/UI/Loader";
import PageHeader from "../../components/UI/PageHeader";
import Placeholder from "../../components/UI/Placeholder";
import Preview from "../../components/UI/Preview";
import FileEntity from "../../entities/FileEntity";
import Size from "../../enums/Size";
import Global from "../../Global";
import Style from "./[alias].module.scss";

// noinspection JSUnusedGlobalSymbols
export default class FileAliasPage extends React.Component<FileAliasPageProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): FileAliasPageProps {
    const alias = (context.query[FileAliasPageQuery.ALIAS] ?? "");

    return {
      [FileAliasPageQuery.ALIAS]: (Array.isArray(alias) ? alias[0] : alias) || "",
    };
  }

  constructor(props: FileAliasPageProps) {
    super(props);
    this.state = {
      loading: true,
      entity:  new FileEntity(),
    };
  }

  public async componentDidMount() {
    if (!this.state.entity.exists() && this.context.state.user) {
      this.setState({
        loading: false,
        entity:  await FileEntity.getByID(this.props[FileAliasPageQuery.ALIAS]),
      });
    }
  }

  public render() {
    return (
      <Loader size={Size.LARGE} show={this.state.loading}>
        <div className={Style.Component}>
          <Placeholder show={!this.state.entity.exists()} text={"File does not exist or you do not have permission to view it."}>
            <PageHeader title={this.state.entity.name}/>
            <div className={Style.Content}>
              <div className={Style.File}>
                <Preview className={Style.Preview} path={this.state.entity.getAPIPath()} type={this.state.entity.file_extension.file_type.name}/>
              </div>
              <div className={Style.Sidebar}>
                <p>ID: {this.state.entity.id}</p>
                <p>Size: {this.state.entity.size}</p>
                <p>Uploader: {this.state.entity.user_created.email}</p>
                <p>Extension: {this.state.entity.file_extension.name}</p>
              </div>
            </div>
          </Placeholder>
        </div>
      </Loader>
    );
  }
}

enum FileAliasPageQuery {
  ALIAS = "alias",
}

interface FileAliasPageProps extends PageProps {
  [FileAliasPageQuery.ALIAS]: string
}

interface State {
  entity: FileEntity
  loading: boolean
}
