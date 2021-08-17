import Component from "../Application/Component";
import HTMLText from "../../classes/HTMLText";
import Conditional from "../Application/Conditional";
import EditableText from "../Text/EditableText";
import Style from "./TextBlock.module.scss";

export default class TextBlock extends Component<TextBlockProps, State> {

  constructor(props: TextBlockProps) {
    super(props);
  }

  public render() {
    const readonly = this.props.readonly ?? true;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        <Conditional condition={readonly}>
          <div className={Style.Text}>
            {this.props.text.toReactElementList()}
          </div>
        </Conditional>
        <Conditional condition={!readonly}>
          <EditableText text={this.props.text} onChange={this.props.onChange} onSubmit={this.props.onSubmit}/>
        </Conditional>
      </div>
    );
  }

}

export interface TextBlockProps {
  text: HTMLText;
  readonly?: boolean;
  className?: string;

  onChange(text: HTMLText): void;
  onSubmit?(text: HTMLText): void;
}

interface State {

}
