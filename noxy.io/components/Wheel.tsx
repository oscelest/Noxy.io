import Component from "./Application/Component";
import Style from "./Wheel.module.scss";
import React from "react";
import Button from "./Form/Button";

export default class Wheel extends Component<WheelProps, State> {

  private static size = 1000;
  private static width = 15;
  private static radius = this.size * 0.45;
  private static margin = 0.05;
  private static center = this.size / 2;

  constructor(props: WheelProps) {
    super(props);
    this.state = {
      ref:       React.createRef(),
      text_list: [
        "Dummy text", "Dummy text",
      ],
    };
  }

  private getSegmentPath = (index: number) => {
    const r0 = Wheel.radius;
    const r1 = Wheel.radius - Wheel.width;
    const [rad1, rad2] = this.getSegmentAngle(index);

    const arc = Math.abs(rad1 - rad2) > Math.PI ? 1 : 0;
    const arcTo1 = `${Wheel.center + r0 * Math.cos(rad2)},${Wheel.center + r0 * Math.sin(rad2)}`;
    const lineTo = `${Wheel.center + r1 * Math.cos(rad2)},${Wheel.center + r1 * Math.sin(rad2)}`;
    const arcTo2 = `${Wheel.center + r1 * Math.cos(rad1)},${Wheel.center + r1 * Math.sin(rad1)}`;
    const moveTo = `${Wheel.center + r0 * Math.cos(rad1)},${Wheel.center + r0 * Math.sin(rad1)}`;

    return [
      `M${moveTo}`,
      `A${r0},${r0},0,${arc},1,${arcTo1}`,
      `L${lineTo}`,
      `A${r1},${r1},0,${arc},0,${arcTo2}`,
      "Z",
    ].join("");
  };

  private getSegmentLine = (index: number) => {
    console.log(index);
  };

  private getSegmentAngle = (index: number) => {
    const degrees = this.getDegrees();
    return [degrees * (index + Wheel.margin / 2) * (Math.PI / 180), degrees * ((index + 1) - Wheel.margin / 2) * (Math.PI / 180)];
  };

  private getDegrees = () => {
    return 360 / this.state.text_list.length;
  };

  public componentDidMount(): void {
    this.setState({});
  }

  public render() {
    const view_box = `0 0 ${Wheel.size} ${Wheel.size}`;
    const left_text = this.state.text_list.filter((text, index) => index % 2 === 0);
    const right_text = this.state.text_list.filter((text, index) => index % 2 !== 0);
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <div className={Style.TextList} data-side={"left"}>{left_text.map(this.renderText)}</div>
        <svg ref={this.state.ref} className={Style.Circle} viewBox={view_box}>
          {this.state.text_list.map(this.renderSegment)}
          {this.state.text_list.map(this.renderLine)}
        </svg>
        <div className={Style.TextList} data-side={"right"}>{right_text.map(this.renderText)}</div>
        <Button onClick={this.eventAddTextClick}>Add text</Button>
        <Button onClick={this.eventRemoveTextClick}>Remove text</Button>
      </div>
    );
  }

  private readonly renderText = (text: string, index: number = 0) => {
    return (
      <div key={index} className={Style.Text}>
        {text}
      </div>
    );
  };

  private readonly renderSegment = (text: string, index: number = 0) => {
    const path = this.getSegmentPath(index);
    const degrees = this.getDegrees();
    const red = 256 * Math.cos((degrees * (index + 1) - degrees / 2) * Math.PI / 180);
    const blue = 256 * Math.cos((degrees * (index + 1) - degrees / 2 + 120) * Math.PI / 180);
    const green = 256 * Math.cos((degrees * (index + 1) - degrees / 2 - 120) * Math.PI / 180);
    const fill = `rgb(${red}, ${blue}, ${green})`;
    const stroke = `none`;
    return (
      <path key={index} d={path} style={{fill, stroke}}/>
    );
  };

  private readonly renderLine = (text: string, index: number = 0) => {
    const degrees = 360 / this.state.text_list.length;
    const path = this.getSegmentLine(index);
    const red = 256 * Math.cos((degrees * (index + 1) - degrees / 2) * Math.PI / 180);
    const blue = 256 * Math.cos((degrees * (index + 1) - degrees / 2 + 120) * Math.PI / 180);
    const green = 256 * Math.cos((degrees * (index + 1) - degrees / 2 - 120) * Math.PI / 180);
    const fill = `rgb(${red}, ${blue}, ${green})`;
    const stroke = `none`;
    return (
      <path key={index} d={""} style={{fill, stroke}}/>
    );
  };

  private readonly eventAddTextClick = () => {
    this.setState({text_list: [...this.state.text_list, "Dummy text"]});
  };

  private readonly eventRemoveTextClick = () => {
    const [, ...text_list] = this.state.text_list;
    this.setState({text_list});
  };

}

export interface WheelProps {
  className?: string;
}

export interface State {
  ref: React.RefObject<SVGSVGElement>;
  text_list: string[];
}
