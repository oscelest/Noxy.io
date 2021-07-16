import React from "react";
import {NextPageContext} from "next";
import Helper from "../../Helper";
import Redirect from "../../components/Application/Redirect";
import Conditional from "../../components/Application/Conditional";
import Button from "../../components/Form/Button";
import Loader from "../../components/UI/Loader";
import PageHeader from "../../components/UI/PageHeader";
import Placeholder from "../../components/UI/Placeholder";
import PageEntity from "../../entities/page/PageEntity";
import IconType from "../../enums/IconType";
import Style from "./[path].module.scss";
import {Masquerade} from "../../components/Application/Masquerade";
import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import Component from "../../components/Application/Component";
import PageBlockExplorer from "../../components/Application/PageBlockExplorer";

// noinspection JSUnusedGlobalSymbols
export default class PageIDPage extends Component<PageIDPageProps, State> {

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): PageIDPageProps {
    return {
      [PageIDPageQuery.PATH]: Helper.getQueryProp(context.query[PageIDPageQuery.PATH], BaseEntity.defaultID),
    };
  }

  constructor(props: PageIDPageProps) {
    super(props);
    this.state = {
      entity:  new PageEntity({id: props[PageIDPageQuery.PATH]}) as State["entity"],
      loading: true,
    };
  }

  public async componentDidMount() {
    const next_state = {} as State;
    next_state.loading = false;

    try {
      if (BaseEntity.regexUUID.exec(this.props[PageIDPageQuery.PATH])) {
        next_state.entity = await PageEntity.getOne(this.props[PageIDPageQuery.PATH]) as State["entity"];
      }
      else {
        next_state.entity = await PageEntity.getOneByPath(this.props[PageIDPageQuery.PATH]) as State["entity"];
      }
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
              <Masquerade className={Style.Masquerade}/>
              <Conditional condition={this.context.isCurrentUser(this.state.entity.user)}>
                <Redirect href={`/page/${this.state.entity.id}/edit`}>
                  <Button icon={IconType.UI_EDIT}>Edit</Button>
                </Redirect>
              </Conditional>
            </PageHeader>
            <PageBlockExplorer page={this.state.entity}/>
          </Placeholder>
        </Loader>
      </div>
    );
  }
}


export enum PageIDPageQuery {
  PATH = "path",
}

export interface PageIDPageProps {
  [PageIDPageQuery.PATH]: string
}

interface State {
  entity: PageEntity

  dialog?: string

  loading: boolean
  placeholder?: string
}
