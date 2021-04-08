import _ from "lodash";
import React from "react";
import Size from "../../enums/Size";
import Loader from "../UI/Loader";
import Placeholder from "../UI/Placeholder";
import Style from "./Table.module.scss";

export default class Table extends React.Component<TableProps, State> {
  
  constructor(props: TableProps) {
    super(props);
    this.state = {};
  }
  
  public render() {
    const classes = [Style.Component];
    const loader_text = typeof this.props.loader === "string" ? this.props.loader : undefined;
    const placeholder_text = typeof this.props.placeholder === "string" ? this.props.placeholder : "No options available";
    
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <Loader className={Style.Loader} size={Size.LARGE} show={!!this.props.loader} text={loader_text}>
          <Placeholder className={Style.Placeholder} show={!this.props.children} text={placeholder_text}>
            {_.map(_.concat(this.props.children), this.renderChild)}
          </Placeholder>
        </Loader>
      </div>
    );
  }
  
  private readonly renderChild = (child: React.ReactNode, index: number = 0) => {
    return (
      <div key={index} className={Style.Row}>
        {child}
      </div>
    );
  };
}


export interface TableProps {
  loader?: string | boolean
  placeholder?: string
  
  className?: string
}

interface State {

}
