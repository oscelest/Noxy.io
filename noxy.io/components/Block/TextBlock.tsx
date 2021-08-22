import Component from "../Application/Component";
import Style from "./TextBlock.module.scss";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import PageBlockType from "../../../common/enums/PageBlockType";
import {Character} from "../../classes/Character";
import EditText from "../Text/EditText";

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
        <EditText readonly={readonly} onChange={this.eventChange} onSubmit={this.eventSubmit}>{this.props.block.content}</EditText>
      </div>
    );
  }

  private readonly eventChange = (content: Character[]) => {
    this.props.onChange(new PageBlockEntity<PageBlockType.TEXT>({...this.props.block, content}));
  };

  private readonly eventSubmit = (content: Character[]) => {
    this.props.onSubmit?.(new PageBlockEntity<PageBlockType.TEXT>({...this.props.block, content}));
  };

}

export interface TextBlockProps {
  block: PageBlockEntity<PageBlockType.TEXT>;
  readonly?: boolean;
  className?: string;

  onChange(block: PageBlockEntity<PageBlockType.TEXT>): void;
  onSubmit?(block: PageBlockEntity<PageBlockType.TEXT>): void;
}

interface State {

}
