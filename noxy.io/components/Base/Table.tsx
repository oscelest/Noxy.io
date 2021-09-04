import _ from "lodash";
import React from "react";
import Size from "../../../common/enums/Size";
import Component from "../Application/Component";
import Loader from "../UI/Loader";
import Placeholder from "../UI/Placeholder";
import Style from "./Table.module.scss";

export default class Table extends Component<TableProps, State> {
  
  constructor(props: TableProps) {
    super(props);
    this.state = {};
  }
  
  public render() {
    const classes = [Style.Component];
    
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <Loader className={Style.Loader} size={Size.LARGE} value={this.props.loading}>
          <Placeholder className={Style.Placeholder} value={!this.props.children || "No options available"}>
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
  loading?: string | boolean
  
  className?: string
}

interface State {

}
