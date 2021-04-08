import React from "react";
import Size from "../../enums/Size";
import Loader from "../UI/Loader";
import Placeholder from "../UI/Placeholder";
import Style from "./Dropdown.module.scss";

export default class Dropdown extends React.Component<DropdownProps, State> {
  
  constructor(props: DropdownProps) {
    super(props);
  }
  
  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    const loader_text = typeof this.props.loading === "string" ? this.props.loading : "Loading...";
    
    return (
      <div className={classes.join(" ")} hidden={this.props.hidden}>
        <Loader className={Style.Loader} size={Size.SMALL} show={!!this.props.loading} text={loader_text}>
          <Placeholder className={Style.Placeholder} show={!this.props.children} text={this.props.placeholder ?? "No options available"}>
            {this.props.children}
          </Placeholder>
        </Loader>
      </div>
    );
  }
}

export interface DropdownProps {
  hidden: boolean
  loading?: string | boolean
  placeholder?: string
  
  className?: string
}

interface State {

}
