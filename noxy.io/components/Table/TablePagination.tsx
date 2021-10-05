import React from "react";
import Util from "../../../common/services/Util";
import IconType from "../../enums/IconType";
import InputType from "../../enums/InputType";
import Component from "../Application/Component";
import Button from "../Form/Button";
import Input from "../Form/Input";
import Style from "./Pagination.module.scss";

export default class TablePagination extends Component<PaginationProps, State> {
  
  constructor(props: PaginationProps) {
    super(props);
    this.state = {};
  }

  public render() {
    const value = this.state.current ?? this.props.current.toString()
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <Button className={Style.Button} icon={IconType.PREV} onClick={this.eventPrevClick} disabled={this.props.current === 1}/>
        <Input className={Style.Input} type={InputType.PHONE} value={value} label={`Page of ${this.props.total}`} onChange={this.eventChange} onBlur={this.eventBlur}/>
        <Button className={Style.Button} icon={IconType.NEXT} onClick={this.eventNextClick} disabled={this.props.current === this.props.total}/>
      </div>
    );
  }

  private readonly eventPrevClick = () => {
    const current = Math.min(this.props.current - 1, this.props.total);
    this.props.onChange(current);
  };

  private readonly eventNextClick = () => {
    const current = Math.min(this.props.current + 1, this.props.total);
    this.props.onChange(current);
  };

  private readonly eventChange = (current: string) => {
    const parsed = +current;
    if (!isNaN(parsed)) {
      if (Util.clamp(parsed, this.props.total, 1)) {
        this.props.onChange(parsed);
      }
      this.setState({current});
    }
  };
  
  private readonly eventBlur = () => {
    this.setState({current: undefined});
  }
}

export interface PaginationProps {
  className?: string
  
  current: number
  total: number
  
  onChange: (page: number) => void
}

interface State {
  current?: string
}
