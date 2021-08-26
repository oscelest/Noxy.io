import Component from "../Application/Component";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import Style from "./TableBlock.module.scss";
import PageBlockType from "../../../common/enums/PageBlockType";
import EditText from "../Text/EditText";
import RichText from "../../classes/RichText";

export default class TableBlock extends Component<TableBlockProps, State> {

  constructor(props: TableBlockProps) {
    super(props);
  }

  private findText = (text: RichText) => {
    for (let row = 0; row < this.props.block.content.length; row++) {
      for (let column = 0; column < this.props.block.content[row].length; column++) {
        if (text.id === this.props.block.content[row][column].id) return [row, column];
      }
    }
    throw "Text not found.";
  };

  public render() {

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    if (this.props.readonly) classes.push(Style.Readonly);

    return (
      <div className={classes.join(" ")}>
        <table>
          <tbody>
            {this.props.block.content.map(this.renderRow)}
          </tbody>
        </table>
      </div>
    );
  }

  private readonly renderRow = (row: RichText[], key: number = 0) => {
    return (
      <tr key={key}>
        {row.map(this.renderColumn)}
      </tr>
    );
  };

  private readonly renderColumn = (column: RichText, key: number = 0) => {
    const readonly = this.props.readonly ?? true;

    return (
      <td key={key}>
        <EditText readonly={readonly} onChange={this.eventChange} onSubmit={this.eventSubmit}>{column}</EditText>
      </td>
    );
  };

  private readonly eventChange = (new_text: RichText, old_text: RichText) => {
    const [row, column] = this.findText(old_text);
    const content = [...this.props.block.content];
    content[row] = [...this.props.block.content[row]];
    content[row][column] = new_text;
    this.props.onChange(new PageBlockEntity<PageBlockType.TABLE>({...this.props.block, content: content}));
  };

  private readonly eventSubmit = () => {
    this.props.onSubmit?.(this.props.block);
  };

}

export interface TableBlockProps {
  block: PageBlockEntity<PageBlockType.TABLE>;
  readonly?: boolean;
  className?: string;

  onChange(block: PageBlockEntity<PageBlockType.TABLE>): void;
  onSubmit?(block: PageBlockEntity<PageBlockType.TABLE>): void;
}

interface State {

}
