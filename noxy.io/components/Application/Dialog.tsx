import _ from "lodash";
import React from "react";
import {v4} from "uuid";
import EventCode from "../../../common/enums/EventCode";
import DialogListenerName from "../../enums/DialogListenerName";
import IconType from "../../enums/IconType";
import Icon from "../Form/Icon";
import DragDrop from "../UI/DragDrop";
import Component from "./Component";
import Conditional from "./Conditional";
import Style from "./Dialog.module.scss";

export default class Dialog extends Component<DialogProps, State> {
  
  public static id = v4();
  public static listener_collection: {[key: string]: Dialog[]} = {};
  
  #instance_list: DialogInstance[] = [];
  #flag_overlay: boolean = false;
  
  constructor(props: DialogProps) {
    super(props);
    this.state = {};
  }
  
  public static getDialogList(listener: string | DialogListenerName) {
    return this.listener_collection[listener] ?? [];
  }
  
  public static show(element: React.ReactNode, init: Partial<DialogConfiguration> = {}) {
    const configuration = {
      ...init,
      id:       init.id ?? v4(),
      dismiss:  init.dismiss ?? true,
      overlay:  init.overlay ?? true,
      listener: init.listener ?? DialogListenerName.GLOBAL,
    };
    
    const collection = Dialog.listener_collection[configuration.listener] ?? [];
    for (let i = 0; i < collection.length; i++) collection.at(i)?.addElement({element, configuration});
    
    return configuration.id;
  }
  
  public static close(id?: string) {
    if (!id) return;
    
    const dialog_list = Object.values(this.listener_collection);
    for (let i = 0; i < dialog_list.length; i++) {
      const listener = dialog_list.at(i);
      for (let j = 0; j < (listener?.length ?? 0); j++) {
        listener?.at(j)?.removeElement(id);
      }
    }
  }
  
  private static subscribe(component: Dialog) {
    Dialog.listener_collection[component.props.listener] = [...Dialog.listener_collection[component.props.listener] ?? [], component];
  }
  
  private static unsubscribe(component: Dialog) {
    const collection = this.getDialogList(component.props.listener);
    for (let i = 0; i < collection.length; i++) {
      if (collection[i] !== component) continue;
      collection.splice(i, 1);
      if (collection.length === 0) delete this.listener_collection[component.props.listener];
    }
  }
  
  private addElement = (instance: DialogInstance) => {
    this.#instance_list = [...this.#instance_list, instance];
    this.updateState();
  };
  
  private removeElement = (id: string) => {
    for (let i = 0; i < this.#instance_list.length; i++) {
      const instance = this.#instance_list.at(i);
      if (instance?.configuration.id !== id) continue;
      instance.configuration.onClose?.();
      this.#instance_list.splice(i--, 1);
    }
    this.updateState();
  };
  
  private readonly getInstance = (id: string) => {
    for (let i = 0; i < this.#instance_list.length; i++) {
      const item = this.#instance_list.at(i);
      if (item?.configuration.id === id) return item;
    }
  };
  
  private readonly getIDFromElement = (element: Element | null) => {
    return element?.closest(`.${Style.Instance}`)?.getAttribute("data-dialog-id") ?? "NULL";
  };
  
  public componentDidMount(): void {
    Dialog.subscribe(this);
  }
  
  public componentWillUnmount(): void {
    Dialog.unsubscribe(this);
  }
  
  public render() {
    if (!this.#instance_list.length) return null;
    
    return (
      <div className={Style.Component} data-active={!!_.size(this.#instance_list)} data-listener={this.props.listener}>
        {this.#instance_list.map(this.renderInstance)}
      </div>
    );
  }
  
  private readonly renderInstance = (instance: DialogInstance, index: number = 0) => {
    return (
      <Conditional key={index} condition={index === 0}>
        <div data-dialog-id={instance.configuration.id} className={Style.Instance} onKeyDown={this.eventDialogKeyDown}>{this.renderDragDrop(instance)}</div>
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
          {instance.element}
        </div>
      </div>
    );
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
  element: React.ReactNode;
  configuration: DialogConfiguration;
}

export interface DialogConfiguration {
  id: string;
  listener: Listener;
  
  drag?: DragDropDialogConfiguration;
  title?: string;
  dismiss?: boolean;
  overlay?: boolean;
  
  onClose?(): void;
}

interface DragDropDialogConfiguration {
  title: string;
  message: string;
  onDrop?(event: React.DragEvent<HTMLDivElement>): void;
  onDragOver?(event: React.DragEvent<HTMLDivElement>): void;
  onDragEnter?(event: React.DragEvent<HTMLDivElement>): void;
  onDragLeave?(event: React.DragEvent<HTMLDivElement>): void;
}

export interface DialogProps {
  listener: Listener;
}

interface State {

}
