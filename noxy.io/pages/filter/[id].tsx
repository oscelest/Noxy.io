import {NextPageContext} from "next";
import React from "react";
import Icon from "../../components/Base/Icon";
import Button from "../../components/Form/Button";
import PageHeader from "../../components/UI/PageHeader";
import IconType from "../../enums/IconType";
import Global from "../../Global";
import Style from "./[id].module.scss";

export default class FilterIDPage extends React.Component<FilterIDPageProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): FilterIDPageProps {
    const id = (context.query[FilterIDPageQuery.ID] ?? "");

    return {
      [FilterIDPageQuery.ID]: (Array.isArray(id) ? id[0] : id) || "",
    };
  }

  constructor(props: FilterIDPageProps) {
    super(props);
  }

  public componentDidMount() {

  }

  public render() {
    return (
      <div className={Style.Component}>
        <PageHeader title={"Filter"}>
          <Button>Test</Button>
        </PageHeader>
        <div className={Style.Filter}>
          <div className={Style.Sidebar}>
            <Icon type={IconType.FILE_EXE}/>
            <Icon type={IconType.FILE_EXE}/>
            <Icon type={IconType.FILE_EXE}/>
            <Icon type={IconType.FILE_EXE}/>
          </div>
          <div className={Style.Content}>
            <div className={Style.Container}>
              <div className={Style.Header}>
                <span>Test</span>
              </div>
              <div className={Style.Lane}>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
              </div>
            </div>
            <div className={Style.Container}>
              <div className={Style.Header}>
                <span>Test</span>
              </div>
              <div className={Style.Lane}>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
              </div>
            </div>
            <div className={Style.Container}>
              <div className={Style.Header}>
                <span>Test</span>
              </div>
              <div className={Style.Lane}>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
              </div>
            </div>
            <div className={Style.Container}>
              <div className={Style.Header}>
                <span>Test</span>
              </div>
              <div className={Style.Lane}>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
              </div>
            </div>
            <div className={Style.Container}>
              <div className={Style.Header}>
                <span>Test</span>
              </div>
              <div className={Style.Lane}>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
              </div>
            </div>
            <div className={Style.Container}>
              <div className={Style.Header}>
                <span>Test</span>
              </div>
              <div className={Style.Lane}>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
                <div className={Style.Card}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

}

export enum FilterIDPageQuery {
  ID = "id"
}

export interface FilterIDPageProps {
  [FilterIDPageQuery.ID]: string
}

interface State {

}
