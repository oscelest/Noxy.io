import _ from "lodash";
import React from "react";
import Loader from "../UI/Loader";
import Placeholder from "../UI/Placeholder";
import Style from "./Select.module.scss";
import Component from "../Application/Component";

export default class Select extends Component<SelectProps, State> {

  constructor(props: SelectProps) {
    super(props);
    this.state = {
      index: -1,
    };
  }

  private readonly getElementIndex = (element: HTMLDivElement) => {
    return _.findIndex(element.parentElement?.children, child => child === element);
  };

  public readonly render = () => {
    const {className, loader, placeholder, children} = this.props;
    const classes = [Style.Component];
    if (className) classes.push(className);

    const loader_text = typeof loader === "string" ? loader : "Loading...";
    const placeholder_text = typeof placeholder === "string" ? placeholder : "No options to show";

    return (
      <div className={classes.join(" ")} onMouseDown={this.eventComponentMouseDown}>
        <Loader className={Style.Loader} show={!!this.props.loader} text={loader_text}>
          <Placeholder className={Style.Placeholder} show={!!this.props.placeholder} text={placeholder_text}>
            {_.map(React.Children.toArray(children), this.renderItem)}
          </Placeholder>
        </Loader>
      </div>
    );
  };

  private readonly renderItem = (child: React.ReactNode, key: number = 0) => {
    const classes = [Style.Item];
    if (this.props.index === key) classes.push(Style.Selected);

    return (
      <div key={key} className={classes.join(" ")} onClick={this.eventItemClick} onMouseEnter={this.eventItemMouseEnter} onMouseLeave={this.eventItemMouseLeave}>
        {child}
      </div>
    );
  };

  private readonly eventComponentMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  private readonly eventItemClick = (event: React.MouseEvent<HTMLDivElement>) => {
    this.props.onCommit(this.getElementIndex(event.currentTarget), event);
  };

  private readonly eventItemMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    const index = this.getElementIndex(event.currentTarget);
    this.props.onChange?.(index, event) || this.setState({index});
  };

  private readonly eventItemMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    this.props.onChange?.(-1, event) || this.setState({index: -1});
  };
}

export type SelectProps = (SelectActiveProps | SelectPassiveProps) & {
  loader?: string | boolean
  placeholder?: string | boolean

  className?: string

  onCommit: (index: number, event: React.MouseEvent<HTMLDivElement>) => void
}

interface SelectPassiveProps {
  index?: never
  onChange?: never
}

interface SelectActiveProps {
  index: number
  onChange: (index: number, event: React.MouseEvent<HTMLDivElement>) => void
}

interface State {
  index: number
}
