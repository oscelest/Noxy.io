import React from "react";
import {NextPageContext} from "next";
import PageEntity from "../../../entities/page/PageEntity";
import Helper from "../../../Helper";
import Placeholder from "../../../components/UI/Placeholder";
import PageHeader from "../../../components/UI/PageHeader";
import Loader from "../../../components/UI/Loader";
import Global from "../../../Global";
import Style from "./edit.module.scss";
import Button from "../../../components/Form/Button";
import IconType from "../../../enums/IconType";
import Entity from "../../../classes/Entity";
import {Masquerade} from "../../../components/Application/Masquerade";
import Router from "next/router";

// noinspection JSUnusedGlobalSymbols
export default class PageIDEditPage extends React.Component<PageIDEditPageProps, State> {

  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): PageIDEditPageProps {
    return {
      [PageIDEditPageQuery.PATH]: Helper.getQueryProp(context.query[PageIDEditPageQuery.PATH], new PageEntity().getPrimaryKey()),
    };
  }

  constructor(props: PageIDEditPageProps) {
    super(props);
    this.state = {
      value:   "",
      entity:  new PageEntity({id: props[PageIDEditPageQuery.PATH]}) as State["entity"],
      loading: true,
    };
  }

  public async componentDidMount() {
    const next_state = {} as State;
    next_state.loading = false;

    try {
      if (Entity.regexID.exec(this.props[PageIDEditPageQuery.PATH])) {
        next_state.entity = await PageEntity.findOne(this.props[PageIDEditPageQuery.PATH]) as State["entity"];
      }
      else {
        next_state.entity = await PageEntity.findOneByPath(this.props[PageIDEditPageQuery.PATH]) as State["entity"];
      }
      next_state.value = next_state.entity.content;
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
            <PageHeader title={`Edit: ${this.state.entity.name}`}>
              <Masquerade className={Style.Masquerade}/>
              <Button icon={IconType.SAVE} onClick={this.eventSave}>Save</Button>
              <Button icon={IconType.SAVE} onClick={this.eventSaveAndClose}>Save & Close</Button>
            </PageHeader>
            <div className={Style.Container}>
              <textarea className={Style.Editor} value={this.state.value} onChange={this.eventValueChange}/>
              <div className={Style.ReferenceList} >

              </div>
            </div>
          </Placeholder>
        </Loader>
      </div>
    );
  }

  private readonly eventSave = async () => {
    if (this.state.entity.content === this.state.value) return;
    await PageEntity.updateOne(this.state.entity.id, {content: this.state.value});
  };

  private readonly eventSaveAndClose = async () => {
    if (this.state.entity.content !== this.state.value) {
      await PageEntity.updateOne(this.state.entity.id, {content: this.state.value});
    }
    return Router.push(`/page/${this.props[PageIDEditPageQuery.PATH]}`);
  };

  private readonly eventValueChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({value: event.target.value});
  };

}


export enum PageIDEditPageQuery {
  PATH = "path",
}

export interface PageIDEditPageProps {
  [PageIDEditPageQuery.PATH]: string
}

interface State {
  entity: PageEntity

  value: string

  dialog?: string

  loading: boolean
  placeholder?: string
}
