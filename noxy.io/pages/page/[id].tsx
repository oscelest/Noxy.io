import React from "react";
import {NextPageContext} from "next";
import Global from "../../Global";
import Helper from "../../Helper";
import Loader from "../../components/UI/Loader";
import PageHeader from "../../components/UI/PageHeader";
import Placeholder from "../../components/UI/Placeholder";
import PageEntity from "../../entities/page/PageEntity";
import Style from "./[id].module.scss";
import Conditional from "../../components/Application/Conditional";
import Button from "../../components/Form/Button";
import Redirect from "../../components/Application/Redirect";
import IconType from "../../enums/IconType";
import Markdown from "../../components/UI/Markdown";

export default class PageIDPage extends React.Component<PageIDPageProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): PageIDPageProps {
    return {
      [PageIDPageQuery.ID]: Helper.getQueryProp(context.query[PageIDPageQuery.ID], new PageEntity().getPrimaryKey()),
    };
  }

  constructor(props: PageIDPageProps) {
    super(props);
    this.state = {
      entity:  new PageEntity({id: props[PageIDPageQuery.ID]}) as State["entity"],
      loading: true,
    };
  }

  public async componentDidMount() {
    const next_state = {} as State;
    next_state.loading = false;

    try {
      next_state.entity = await PageEntity.findOne(this.props[PageIDPageQuery.ID]) as State["entity"];
    }
    catch (error) {
      next_state.placeholder = "Page could not be loaded.";
    }

    this.setState(next_state);
  }

  public render() {
    return (
      <div className={Style.Component}>
        <Loader show={!this.state.entity.exists()}>
          <Placeholder show={!!this.state.placeholder} text={this.state.placeholder}>
            <PageHeader title={this.state.entity.name}>
              <Conditional condition={this.context.isCurrentUser(this.state.entity.user_created)}>
                <Redirect href={`/page/${this.state.entity.id}/edit`}>
                  <Button icon={IconType.UI_EDIT}>Edit</Button>
                </Redirect>
              </Conditional>
            </PageHeader>
            <Markdown>
              {this.state.entity.content}
            </Markdown>
          </Placeholder>
        </Loader>
      </div>
    );
  }
}


export enum PageIDPageQuery {
  ID = "id",
}

export interface PageIDPageProps {
  [PageIDPageQuery.ID]: string
}

interface State {
  entity: PageEntity

  dialog?: string

  loading: boolean
  placeholder?: string
}
