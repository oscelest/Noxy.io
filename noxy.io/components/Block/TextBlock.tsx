import Component from "../Application/Component";
import HTMLText from "../../classes/HTMLText";
import Conditional from "../Application/Conditional";
import EditableText from "../Text/EditableText";
import Style from "./TextBlock.module.scss";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";

export default class TextBlock extends Component<TextBlockProps, State> {

  constructor(props: TextBlockProps) {
    super(props);
  }

  public render() {
    const readonly = this.props.readonly ?? true;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    if (this.props.readonly) classes.push(Style.Readonly);

    return (
      <div className={classes.join(" ")}>
        <Conditional condition={readonly}>
          {this.props.block.content.toReactElementList()}
        </Conditional>
        <Conditional condition={!readonly}>
          <EditableText text={this.props.block.content} onChange={this.eventChange} onSubmit={this.eventSubmit}/>
        </Conditional>
      </div>
    );
  }

  private readonly eventChange = (content: HTMLText) => {
    this.props.onChange(new PageBlockEntity<HTMLText>({...this.props.block, content}));
  };

  private readonly eventSubmit = (content: HTMLText) => {
    this.props.onSubmit?.(new PageBlockEntity<HTMLText>({...this.props.block, content}));
  };

}

export interface TextBlockProps {
  block: PageBlockEntity<HTMLText>;
  readonly?: boolean;
  className?: string;

  onChange(block: PageBlockEntity<HTMLText>): void;
  onSubmit?(block: PageBlockEntity<HTMLText>): void;
}

interface State {

}
