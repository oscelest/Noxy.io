import React from "react";
import Component from "../Application/Component";
import Loader from "../UI/Loader";
import Placeholder from "../UI/Placeholder";
import Style from "./Index.module.scss";

export default class Index extends Component<IndexProps, State> {
  
  constructor(props: IndexProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }
  
  public getValueList() {
    const result = [] as string[];
    if (!this.state.ref.current) return result;
    
    for (let i = 0; i < this.state.ref.current.children.length; i++) {
      const child = this.state.ref.current.children[i] as HTMLDivElement;
      result.push(child.innerText);
    }
    
    return result;
  }
  
  private getList() {
    return React.Children.toArray(this.props.children);
  }
  
  private readonly getIndexFromElement = (target: HTMLDivElement) => {
    if (!this.state.ref.current) return -1;
    
    for (let i = 0; i < this.state.ref.current.children.length; i++) {
      if (this.state.ref.current.children.item(i) === target) {
        return i;
      }
    }

    return -1;
  };
  
  public readonly render = () => {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div ref={this.state.ref} className={classes.join(" ")} onMouseEnter={this.props.onMouseEnter} onMouseLeave={this.props.onMouseLeave}>
        <Loader className={Style.Loader} value={this.props.loading} color={"#767676"}>
          <Placeholder className={Style.Placeholder} value={this.props.placeholder}>
            {this.getList().map(this.renderItem)}
          </Placeholder>
        </Loader>
      </div>
    );
  };
  
  private readonly renderItem = (child: React.ReactNode, key: number = 0) => {
    const classes = [Style.Item];
    if (this.props.index === key) classes.push(Style.Selected);
    
    return (
      <div key={key} className={classes.join(" ")} onMouseDown={this.eventItemMouseDown} onMouseEnter={this.eventItemMouseEnter} onClick={this.eventItemClick}>
        {child}
      </div>
    );
  };
  
  private readonly eventItemMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  private readonly eventItemClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    this.props.onCommit?.(this.getIndexFromElement(event.currentTarget), event);
  };
  
  private readonly eventItemMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    this.props.onChange?.(this.getIndexFromElement(event.currentTarget), event);
  };
}

export interface IndexProps {
  loading?: string | boolean;
  placeholder?: string | boolean;
  
  index: number;
  className?: string;
  children?: (React.ReactElement | string)[];
  
  onChange?(index: number, event: React.MouseEvent<HTMLDivElement>): void;
  onCommit?(index: number, event: React.MouseEvent<HTMLDivElement>): void;
  
  onMouseEnter?( event: React.MouseEvent<HTMLDivElement>): void;
  onMouseLeave?( event: React.MouseEvent<HTMLDivElement>): void;
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
}
