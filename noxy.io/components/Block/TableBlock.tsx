import {v4} from "uuid";
import PageBlockType from "../../../common/enums/PageBlockType";
import Decoration from "../../classes/Decoration";
import RichText from "../../classes/RichText";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import IconType from "../../enums/IconType";
import Component from "../Application/Component";
import {DefaultBlockProps, PageBlockInterface} from "../Application/PageExplorer";
import Button from "../Form/Button";
import EditText from "../Text/EditText";
import Style from "./TableBlock.module.scss";

export default class TableBlock extends Component<TableBlockProps, State> implements PageBlockInterface {
  
  constructor(props: TableBlockProps) {
    super(props);
  }
  
  public static create = () => {
    return new PageBlockEntity({
      id:      v4(),
      type:    PageBlockType.TABLE,
      content: [[new RichText(), new RichText()], [new RichText(), new RichText()]],
    });
  };
  
  public decorate(decoration: Initializer<Decoration>): void {
  
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
    
    return (
      <div className={classes.join(" ")}>
        <div className={Style.Row}>
          <table>
            <tbody>
              {this.props.block.content.map(this.renderRow)}
            </tbody>
          </table>
          <Button icon={IconType.PLUS} onClick={this.eventAddColumnClick}>Column</Button>
        </div>
        <div className={Style.Row}>
          <Button icon={IconType.PLUS} onClick={this.eventAddRowClick}>Row</Button>
        </div>
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
    return (
      <td key={key}>
        <EditText readonly={this.props.readonly} onBlur={this.eventBlur} onFocus={this.eventFocus} onChange={this.eventChange} onSubmit={this.eventSubmit}>
          {column}
        </EditText>
      </td>
    );
  };
  
  private readonly eventAddRowClick = () => {
    const content = [...this.props.block.content];
    const count = this.props.block.content.reduce((result, row) => Math.max(row.length, result), 0);
    
    const array = [] as RichText[];
    for (let i = 0; i < count; i++) array.push(new RichText());
    content.push(array);
    
    this.props.onChange(new PageBlockEntity<PageBlockType.TABLE>({...this.props.block, content}))
  }
  
  private readonly eventAddColumnClick = () => {
    const content = [...this.props.block.content];
    for (let i = 0; i < content.length; i++) content[i] = [...content[i], new RichText()];
    this.props.onChange(new PageBlockEntity<PageBlockType.TABLE>({...this.props.block, content}))
  }
  
  private readonly eventBlur = () => {
    this.props.onBlur?.(this.props.block);
  };
  
  private readonly eventFocus = () => {
    this.props.onFocus?.(this.props.block);
  };
  
  private readonly eventChange = (new_text: RichText, old_text: RichText) => {
    const [row, column] = this.findText(old_text);
    const content = [...this.props.block.content];
    content[row] = [...this.props.block.content[row]];
    content[row][column] = new_text;
    this.props.onChange(new PageBlockEntity<PageBlockType.TABLE>({...this.props.block, content}));
  };
  
  private readonly eventSubmit = () => {
    this.props.onSubmit?.(this.props.block);
  };
  
}

export interface TableBlockProps extends DefaultBlockProps<PageBlockType.TABLE> {

}

interface State {

}
