import _ from "lodash";
import React from "react";
import IconType from "../../enums/IconType";
import InputType from "../../enums/InputType";
import Button from "../Form/Button";
import Input from "../Form/Input";
import Style from "./Pagination.module.scss";
import Component from "../Application/Component";

export default class Pagination extends Component<PaginationProps, State> {
  
  constructor(props: PaginationProps) {
    super(props);
    this.state = {
      current: 0,
    };
  }

  public componentDidMount() {
    this.setState({current: Math.max(this.props.current, 1)});
  }

  public componentDidUpdate(prevProps: Readonly<PaginationProps>, prevState: Readonly<State>, snapshot?: any): void {
    const next_state = {} as State;
    if (this.props.current && prevProps.current !== this.props.current) next_state.current = this.props.current;
    if (_.size(next_state)) this.setState(next_state);
  }

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <Button className={Style.Button} icon={IconType.PREV} onClick={this.eventPrevClick} disabled={this.props.current === 1}/>
        <Input className={Style.Input} type={InputType.PHONE} value={this.state.current} label={`Page of ${this.props.total}`} onChange={this.eventChange} onReset={this.eventReset}/>
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

  private readonly eventChange = (current: number) => {
    if (current > 0 && current <= this.props.total && current !== this.props.current) {
      this.props.onChange(current);
    }
    this.setState({current});
  };

  private readonly eventReset = () => {
    this.setState({current: Math.max(this.state.current, 1)});
  };
}

export interface PaginationProps {
  className?: string
  
  current: number
  total: number
  
  onChange: (page: number) => void
}

interface State {
  current: number
}
