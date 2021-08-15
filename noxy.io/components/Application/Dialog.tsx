import _ from "lodash";
import React from "react";
import {v4} from "uuid";
import DialogListenerName from "../../enums/DialogListenerName";
import EventCode from "../../enums/EventCode";
import IconType from "../../enums/IconType";
import QueuePosition from "../../enums/QueuePosition";
import Icon from "../Form/Icon";
import DragDrop from "../UI/DragDrop";
import Conditional from "./Conditional";
import Style from "./Dialog.module.scss";
import Component from "./Component";
import Util from "../../../common/services/Util";

export default class Dialog extends Component<DialogProps, State> {

  public static id = v4();
  public static dialog_listener_collection: {[key: string]: Dialog[]};

  #instance_list: DialogInstance[] = [];
  #flag_overlay: boolean = false;

  constructor(props: DialogProps) {
    super(props);
    this.state = {};
  }

  private static getDialogList(listener: Listener) {
    if (!this.dialog_listener_collection) this.dialog_listener_collection = {};
    if (!this.dialog_listener_collection[listener]) this.dialog_listener_collection[listener] = [];
    return this.dialog_listener_collection[listener];
  }

  public static show(element: React.ReactNode, init: Partial<DialogConfiguration> = {}) {
    const configuration = {
      ...init,
      id:       init.id ?? v4(),
      dismiss:  init.dismiss ?? true,
      overlay:  init.overlay ?? true,
      position: init.position ?? QueuePosition.NEXT,
      listener: init.listener ?? DialogListenerName.GLOBAL,
    };

    for (let dialog of this.getDialogList(configuration.listener)) {
      dialog.addElement({element, configuration});
    }
    return configuration.id;
  }

  public static close(id?: string) {
    if (!id) return undefined;
    for (let dialog_list of Object.values(this.dialog_listener_collection)) {
      for (let dialog of dialog_list) {
        dialog.removeElement(id);
      }
    }
    return undefined;
  }

  private static subscribe(component: Dialog) {
    this.getDialogList(component.props.listener).push(component);
  }

  private static unsubscribe(component: Dialog) {
    _.remove(this.getDialogList(component.props.listener), dialog => dialog === component);
  }

  private addElement = (instance: DialogInstance) => {
    this.setState({});
    _.remove(this.#instance_list, value => value.configuration.id === instance.configuration.id);

    switch (instance.configuration.position) {
      case QueuePosition.FIRST:
        return this.#instance_list = [instance, ...this.#instance_list];
      case QueuePosition.NEXT:
        return this.#instance_list = this.#instance_list.length ? [this.#instance_list[0], instance, ..._.tail(this.#instance_list)] : [instance];
      case QueuePosition.LAST:
        return this.#instance_list = [...this.#instance_list, instance];
    }
  };

  private removeElement = (id: string) => {
    const indexes = [];
    for (let index = 0; index < this.#instance_list.length; index++) {
      const instance = this.#instance_list[index];
      if (instance.configuration.id !== id) continue;
      indexes.push(index);
      instance.configuration.onClose?.();
    }

    _.pullAt(this.#instance_list, indexes);
    Util.schedule(() => this.setState({}));
  };

  private readonly getInstance = (id: string) => {
    return _.find(this.#instance_list, instance => instance.configuration.id === id);
  };

  private readonly getIDFromElement = (element: Element | null) => {
    return element?.closest(`.${Style.Instance}`)?.getAttribute("data-id") ?? "NULL";
  };

  public componentDidMount(): void {
    Dialog.subscribe(this);
  }

  public componentWillUnmount(): void {
    Dialog.unsubscribe(this);
  }

  public render() {
    return (
      <div className={Style.Component} data-active={!!_.size(this.#instance_list)} data-listener={this.props.listener}>
        {_.map(this.#instance_list, this.renderInstance)}
      </div>
    );
  }

  private readonly renderInstance = (instance: DialogInstance, index: number = 0) => {
    return (
      <Conditional key={index} condition={index === 0}>
        <div data-id={instance.configuration.id} className={Style.Instance} onKeyDown={this.eventDialogKeyDown}>{this.renderDragDrop(instance)}</div>
      </Conditional>
    );
  };

  private readonly renderDragDrop = (instance: DialogInstance) => {
    if (!instance.configuration.drag) return this.renderOverlay(instance);
    const {title, message, onDrop, onDragEnter, onDragLeave, onDragOver} = instance.configuration.drag;

    return (
      <DragDrop className={Style.DragDrop} title={title} message={message} onDrop={onDrop} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver}>
        {this.renderOverlay(instance)}
      </DragDrop>
    );
  };

  private readonly renderOverlay = (instance: DialogInstance) => {
    if (!instance.configuration.overlay) return this.renderContent(instance);

    return (
      <div className={Style.Overlay} onMouseDown={this.eventOverlayMouseDown} onMouseUp={this.eventOverlayMouseUp}>
        {this.renderContent(instance)}
      </div>
    );
  };

  private readonly renderContent = (instance: DialogInstance) => {
    return (
      <div className={Style.Window}>
        <Conditional condition={instance.configuration.dismiss}>
          <Icon className={Style.Close} type={IconType.CLOSE} onClick={this.eventClose}/>
        </Conditional>
        <Conditional condition={instance.configuration.title}>
          <span className={Style.Title}>{instance.configuration.title}</span>
        </Conditional>
        <div className={Style.Container}>
          {this.renderElement(instance)}
        </div>
      </div>
    );
  };

  private readonly renderElement = (instance: DialogInstance) => {
    if (typeof instance.element === "object") {
      const jsx = (instance.element as JSX.Element);
      return React.createElement(jsx.type, {...jsx.props, key: instance.configuration.id});
    }
    return instance.element;
  };

  private readonly eventClose = (event: React.MouseEvent) => {
    Dialog.close(this.getIDFromElement(event.currentTarget));
  };

  private readonly eventDialogKeyDown = (event: React.KeyboardEvent) => {
    if (event.code === EventCode.ESCAPE) {
      const instance = this.getInstance(this.getIDFromElement(event.currentTarget));
      if (instance?.configuration.dismiss) {
        Dialog.close(this.getIDFromElement(event.currentTarget));
      }
    }
  };

  private readonly eventOverlayMouseDown = (event: React.MouseEvent) => {
    const instance = this.getInstance(this.getIDFromElement(event.currentTarget));
    if (!instance?.configuration.dismiss || event.button !== 0) return;
    this.#flag_overlay = event.target === event.currentTarget;
  };

  private readonly eventOverlayMouseUp = (event: React.MouseEvent) => {
    const instance = this.getInstance(this.getIDFromElement(event.currentTarget));
    if (!instance?.configuration.dismiss || event.button !== 0) return;
    if (this.#flag_overlay && event.target === event.currentTarget) Dialog.close(instance?.configuration.id);
    this.#flag_overlay = false;
  };

}

type Listener = string | DialogListenerName

interface DialogInstance {
  element: React.ReactNode
  configuration: DialogConfiguration
}

export interface DialogConfiguration {
  id: string
  listener: Listener
  position: QueuePosition

  drag?: DragDropDialogConfiguration
  title?: string
  dismiss?: boolean
  overlay?: boolean

  onClose?(): void
}

interface DragDropDialogConfiguration {
  title: string
  message: string
  onDrop?(event: React.DragEvent<HTMLDivElement>): void
  onDragOver?(event: React.DragEvent<HTMLDivElement>): void
  onDragEnter?(event: React.DragEvent<HTMLDivElement>): void
  onDragLeave?(event: React.DragEvent<HTMLDivElement>): void
}

export interface DialogProps {
  listener: Listener
}

interface State {

}
