import {NextPageContext} from "next";
import React from "react";
import Authorized from "../../components/Application/Authorized";
import FileExplorer from "../../components/Application/FileExplorer";
import {Masquerade} from "../../components/Application/Masquerade";
import PageHeader from "../../components/UI/PageHeader";
import Global from "../../Global";
import Style from "./index.module.scss";

// noinspection JSUnusedGlobalSymbols
export default class FilePage extends React.Component<FilePageProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): FilePageProps {
    const name = (context.query[FilePageQuery.NAME] ?? "");

    return {
      [FilePageQuery.NAME]: Array.isArray(name) ? name[0] : name,
    };
  }

  constructor(props: FilePageProps) {
    super(props);

    this.state = {
      ref_file_browser: React.createRef(),
    };
  }

  public render() {
    const {ref_file_browser} = this.state;

    return (
      <Authorized form={true}>
        <div className={Style.Component}>

          <PageHeader className={Style.PageHeader} title={"My files"}>
            <Masquerade className={Style.Masquerade} onChange={this.eventMasqueradeChange}/>
          </PageHeader>

          <FileExplorer className={Style.FileBrowser} ref={ref_file_browser}/>

        </div>
      </Authorized>
    );
  }

  private readonly eventMasqueradeChange = async () => {
    this.state.ref_file_browser.current?.searchFile({file_search: "", pagination_current: 1});
  };

}

enum FilePageQuery {
  NAME = "name",
}

export interface FilePageProps {
  [FilePageQuery.NAME]: string
}

interface State {
  ref_file_browser: React.RefObject<FileExplorer>
}
