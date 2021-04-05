import _ from "lodash";
import React, {RefObject} from "react";
import {v4 as UUID} from "uuid";
import Style from "./Dialog.module.scss";

export enum DialogListenerType {
  GLOBAL = "global",
  OVERLAY = "overlay",
  FILE_BROWSER = "file_browser",
}

export enum DialogPriority {
  FIRST,
  NEXT,
  LAST
}

export default class Dialog extends React.Component<DialogProps, State> {

  public static listeners: { [K in DialogListenerType]: Dialog[] } = {
    [DialogListenerType.GLOBAL]:       [],
    [DialogListenerType.OVERLAY]:      [],
    [DialogListenerType.FILE_BROWSER]: [],
  };
  
  #instances: DialogInstance[];
  
  constructor(props: DialogProps) {
    super(props);
    this.state = {
      instances: [],
      container: React.createRef(),
    };
    this.#instances = [];
  }
  
  public static show(listener: DialogListenerType, priority: DialogPriority, element: React.ComponentElement<any, any>) {
    _.each(this.listeners[listener], listener => listener.addElement(priority, element));
  }
  
  public static close(element: React.Component | React.ComponentElement<any, any>) {
    _.each(this.listeners, listeners => _.each(listeners, listener => listener.removeElement(element)));
  }
  
  public static closeAll(listener?: DialogListenerType) {
    if (listener) {
      _.each(this.listeners[listener], listener => listener.removeAllElements());
    }
    else {
      _.each(this.listeners, listeners => _.each(listeners, listener => listener.removeAllElements()));
    }
  }
  
  private static subscribe(component: Dialog, listener: DialogListenerType) {
    this.listeners[listener].push(component);
  }
  
  private static unsubscribe(component: Dialog, listener: DialogListenerType) {
    this.listeners[listener].splice(_.findIndex(this.listeners[listener], listener => listener === component), 1);
  }
  
  private addElement = (priority: DialogPriority, element: React.ComponentElement<any, any>) => {
    const reference = (element.ref ?? React.createRef()) as RefObject<any>;
    const instance = {reference, element: <element.type {...element.props} ref={reference} key={UUID()}/>};
    
    switch (priority) {
      case DialogPriority.FIRST:
        this.#instances.unshift(instance);
        break;
      case DialogPriority.NEXT:
        this.#instances.splice(Math.min(this.#instances.length, 1), 0, instance);
        break;
      case DialogPriority.LAST:
        this.#instances.push(instance);
        break;
    }
    
    return this.setState({instances: [...this.#instances]});
  };
  
  private removeElement = (component: React.Component | React.ReactElement) => {
    this.#instances = _.filter(this.state.instances, value => !(value.element === component || value.reference.current === component));
    this.setState({instances: this.#instances});
  };
  
  private removeAllElements = () => {
    this.#instances.length = 0;
    this.setState({instances: this.#instances});
  };
  
  public componentDidMount(): void {
    Dialog.subscribe(this, this.props.listener);
  }
  
  public componentWillUnmount(): void {
    Dialog.unsubscribe(this, this.props.listener);
  }
  
  public render() {
    return (
      <div ref={this.state.container} className={Style.dialog} data-active={!!_.size(this.state.instances)}>
        {_.map(this.state.instances, instance => instance.element)}
      </div>
    );
  }
}

export interface DialogProps {
  listener: DialogListenerType
}

interface State {
  instances: DialogInstance[]
  container: React.RefObject<HTMLDivElement>
}

interface DialogInstance {
  reference: React.RefObject<any>
  element: React.ComponentElement<any, any>
}
