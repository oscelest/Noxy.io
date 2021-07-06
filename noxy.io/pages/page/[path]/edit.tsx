import React from "react";
import {NextPageContext} from "next";
import PageEntity from "../../../entities/page/PageEntity";
import Helper from "../../../Helper";
import Placeholder from "../../../components/UI/Placeholder";
import PageHeader from "../../../components/UI/PageHeader";
import Loader from "../../../components/UI/Loader";
import Style from "./edit.module.scss";
import Button from "../../../components/Form/Button";
import IconType from "../../../enums/IconType";
import {Masquerade} from "../../../components/Application/Masquerade";
import Router from "next/router";
import FatalException from "../../../exceptions/FatalException";
import _ from "lodash";
import RadioButton, {RadioButtonCollection} from "../../../components/Form/RadioButton";
import Privacy from "../../../../common/enums/Privacy";
import FileEntity from "../../../entities/file/FileEntity";
import EllipsisText from "../../../components/Text/EllipsisText";
import Preview from "../../../components/UI/Preview";
import BaseEntity from "../../../../common/classes/BaseEntity";
import Input from "../../../components/Form/Input";
import Component from "../../../components/Application/Component";
import UserEntity from "../../../entities/UserEntity";
import Textarea from "../../../components/Form/Textarea";

// noinspection JSUnusedGlobalSymbols
export default class PageIDEditPage extends Component<PageIDEditPageProps, State> {

  // noinspection JSUnusedGlobalSymbols
  public static getInitialProps(context: NextPageContext): PageIDEditPageProps {
    return {
      [PageIDEditPageQuery.PATH]: Helper.getQueryProp(context.query[PageIDEditPageQuery.PATH], new PageEntity().getPrimaryID()),
    };
  }

  constructor(props: PageIDEditPageProps) {
    super(props);
    this.state = {
      owner:   false,
      value:   "",
      entity:  new PageEntity({id: props[PageIDEditPageQuery.PATH]}) as State["entity"],
      loading: true,
    };
  }

  public async componentDidMount() {
    const next_state = {} as State;
    next_state.loading = false;

    try {
      if (BaseEntity.defaultID === this.props[PageIDEditPageQuery.PATH]) {
        next_state.entity = new PageEntity({user: this.context.state.user, privacy: Privacy.PRIVATE});
      }
      else if (BaseEntity.regexUUID.exec(this.props[PageIDEditPageQuery.PATH])) {
        next_state.entity = await PageEntity.getOne(this.props[PageIDEditPageQuery.PATH]) as State["entity"];
      }
      else {
        next_state.entity = await PageEntity.getOneByPath(this.props[PageIDEditPageQuery.PATH]) as State["entity"];
      }

      next_state.owner = this.context.isCurrentUser(next_state.entity.user);
      next_state.privacy = {
        [Privacy.PRIVATE]: RadioButton.createElement(Privacy.PRIVATE, "Private", next_state.entity.privacy === Privacy.PRIVATE, !next_state.owner),
        [Privacy.LINK]:    RadioButton.createElement(Privacy.LINK, "With link", next_state.entity.privacy === Privacy.LINK, !next_state.owner),
        [Privacy.PUBLIC]:  RadioButton.createElement(Privacy.PUBLIC, "Public", next_state.entity.privacy === Privacy.PUBLIC, !next_state.owner),
      };
      next_state.value = next_state.entity.content;
    }
    catch (error) {
      next_state.placeholder = "Page could not be loaded.";
    }

    this.setState(next_state);
  }

  public render() {
    const title = this.state.entity.exists() ? `Editing:` : "Create:";

    return (
      <div className={Style.Component}>

        <PageHeader className={Style.Header} title={title} loading={this.state.loading}>
          <Masquerade className={Style.Masquerade} onChange={this.eventMasqueradeChange}/>
        </PageHeader>

        <div className={Style.Container}>
          <Loader show={this.state.loading}>
            <Placeholder show={!!this.state.placeholder} text={this.state.placeholder}>

              <div className={Style.Main}>
                <div className={Style.Info}>
                  <Input className={Style.Name} label={"Title"} value={this.state.entity.name} onChange={this.eventNameChange}/>
                  <Input className={Style.Path} label={"URL"} value={this.state.entity.path} onChange={this.eventPathChange}/>
                </div>

                <div className={Style.Text}>
                  <Textarea className={Style.Summary} label={"Summary"} value={this.state.entity.summary}/>
                  <Textarea className={Style.Content} label={"Content"} value={this.state.entity.content}/>
                </div>

                <div className={Style.Action}>
                  <Button icon={IconType.SAVE} onClick={this.eventSave}>Save</Button>
                  <Button icon={IconType.SAVE} onClick={this.eventSaveAndClose}>Save & Close</Button>
                </div>
              </div>

              <div className={Style.Sidebar}>
                <RadioButton className={Style.Privacy} onChange={this.eventFilePrivacyChange}>
                  {this.state.privacy}
                </RadioButton>
                <Button className={Style.ManageReference}>Manage references</Button>
                <div className={Style.ReferenceList}>
                  {_.map(this.state.entity.file_list, this.renderReference)}
                </div>
              </div>

            </Placeholder>
          </Loader>
        </div>
      </div>
    );
  }

  private readonly renderReference = (file: FileEntity, index: number = 0) => {
    return (
      <div key={index} className={Style.Reference}>
        <Button className={Style.ReferenceInsert} icon={IconType.LINK}/>
        <Preview className={Style.ReferencePreview} file={file}/>
        <div className={Style.ReferenceText}>
          <EllipsisText className={Style.ReferenceName}>{file.name}</EllipsisText>
          <EllipsisText className={Style.ReferenceID}>{file.id}</EllipsisText>
        </div>
      </div>
    );
  };

  private readonly eventNameChange = (name: string) => {
    this.setState({entity: new PageEntity({...this.state.entity, name})});
  };

  private readonly eventPathChange = (path: string) => {
    this.setState({entity: new PageEntity({...this.state.entity, path})});
  };

  // private readonly eventSummaryChange = (summary: string, event: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   this.setState({entity: new PageEntity({...this.state.entity, summary})});
  // };

  // private readonly eventContentChange = (content: string, event: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   this.setState({entity: new PageEntity({...this.state.entity, content})});
  // };

  private readonly eventFilePrivacyChange = async (privacy: RadioButtonCollection<Privacy>) => {
    if (!this.state.entity) {
      throw new FatalException("Could not manage file privacy", "The system encountered an unexpected error while managing the privacy settings for this file. Please reload the page and try again.");
    }

    this.setState({privacy});
    this.state.entity.privacy = _.find(privacy, item => !!item.checked)?.value ?? this.state.entity.privacy;

    const entity = await PageEntity.putOne(this.props[PageIDEditPageQuery.PATH], {privacy: this.state.entity.privacy});
    this.setState({entity});

    if (privacy.link.checked) {
      await Router.replace({pathname: location.origin + location.pathname, query: {hash: entity.share_hash}});
    }
    else {
      await Router.replace({pathname: location.origin + location.pathname});
    }
  };

  private readonly eventSave = async () => {
    if (this.state.entity.content === this.state.value) return;
    await PageEntity.putOne(this.state.entity.id, {content: this.state.value});
  };

  private readonly eventSaveAndClose = async () => {
    if (this.state.entity.content !== this.state.value) {
      await PageEntity.putOne(this.state.entity.id, {content: this.state.value});
    }
    return Router.push(`/page/${this.state.entity.path}`);
  };


  private readonly eventMasqueradeChange = (user: UserEntity) => {
    Router.reload();
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
  owner?: boolean
  privacy?: RadioButtonCollection<Privacy>

  dialog?: string
  loading: boolean
  placeholder?: string
}
