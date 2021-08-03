import {NextPageContext} from "next";
import React from "react";
import SetOperation from "../../../common/enums/SetOperation";
import Authorized from "../../components/Application/Authorized";
import FileExplorer from "../../components/Application/FileExplorer";
import {Masquerade} from "../../components/Application/Masquerade";
import PageHeader from "../../components/UI/PageHeader";
import Style from "./index.module.scss";
import Component from "../../components/Application/Component";

// noinspection JSUnusedGlobalSymbols
export default class FilePage extends Component<FilePageProps, State> {

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): FilePageProps {
    const search = context.query[FilePageQuery.SEARCH] ?? "";
    const tag = context.query[FilePageQuery.TAG] ?? [];
    const type = context.query[FilePageQuery.TYPE] ?? [];
    const page = context.query[FilePageQuery.PAGE] ?? "";
    const size = context.query[FilePageQuery.SIZE] ?? "";

    const set_operation = context.query[FilePageQuery.SET_OPERATION] ?? "";
    const parsed_set_operation = Array.isArray(set_operation) ? set_operation[0] : set_operation;

    const order = context.query[FilePageQuery.ORDER] ?? "";

    return {
      [FilePageQuery.SEARCH]:        Array.isArray(search) ? search[0] : search,
      [FilePageQuery.TAG]:           Array.isArray(tag) ? tag : [tag],
      [FilePageQuery.PAGE]:          +(Array.isArray(page) ? page[0] : page),
      [FilePageQuery.SIZE]:          +(Array.isArray(size) ? size[0] : size),
      [FilePageQuery.ORDER]:         Array.isArray(order) ? order : [order],
      [FilePageQuery.SET_OPERATION]: parsed_set_operation === SetOperation.UNION ? SetOperation.UNION : SetOperation.INTERSECTION,
      [FilePageQuery.TYPE]:          Array.isArray(type) ? type : [type],
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

    return <Authorized form={true}>
      <div className={Style.Component}>

        <PageHeader className={Style.PageHeader} title={"My files"}>
          <Masquerade className={Style.Masquerade} onChange={this.eventMasqueradeChange}/>
        </PageHeader>

        <FileExplorer className={Style.FileBrowser} ref={ref_file_browser}/>

      </div>
    </Authorized>;
  }

  private readonly eventMasqueradeChange = async () => {
    this.state.ref_file_browser.current?.searchFile({file_search: "", pagination_current: 1});
  };

}

enum FilePageQuery {
  SEARCH = "search",
  ORDER = "order",
  PAGE = "page",
  SET_OPERATION = "set_operation",
  TAG = "tag",
  TYPE = "type",
  SIZE = "size",
}

export interface FilePageProps {
  [FilePageQuery.SEARCH]: string
  [FilePageQuery.ORDER]: string[]
  [FilePageQuery.PAGE]: number
  [FilePageQuery.SIZE]: number
  [FilePageQuery.SET_OPERATION]: SetOperation
  [FilePageQuery.TAG]: string[]
  [FilePageQuery.TYPE]: string[]
}

interface State {
  ref_file_browser: React.RefObject<FileExplorer>
}
