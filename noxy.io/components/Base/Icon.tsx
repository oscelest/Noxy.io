import React from "react";
import IconType from "../../enums/components/IconType";
import Style from "./Icon.module.scss";

export default class Icon extends React.Component<IconProps, State> {
  
  constructor(props: IconProps) {
    super(props);
  }
  
  public render() {
    const {className, type} = this.props;

    const classes = [Style.Component];
    if (className) classes.push(className);
    
    return (
      <div className={classes.join(" ")} onClick={this.props.onClick}>{type}</div>
    );
  }
}

export interface IconProps {
  type: IconType
  className?: string

  onClick?(event: React.MouseEvent<HTMLDivElement>): void
}

interface State {

}
