import React from "react";
import PageBlockType from "../../../common/enums/PageBlockType";
import RichText from "../../classes/RichText";
import TablePageBlockEntity from "../../entities/Page/Block/TablePageBlockEntity";
import IconType from "../../enums/IconType";
import Component from "../Application/Component";
import Conditional from "../Application/Conditional";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import Button from "../Form/Button";
import EditText, {EditTextCommandList} from "../Text/EditText";
import Style from "./TableBlock.module.scss";

export default class TableBlock extends Component<TableBlockProps, State> {
  
  private static readonly blacklist: EditTextCommandList = [];
  private static readonly whitelist: EditTextCommandList = [];
  
  constructor(props: TableBlockProps) {
    super(props);
    this.state = {};
  }
  
  public static create(initializer?: Omit<Initializer<TablePageBlockEntity>, "type">) {
    return new TablePageBlockEntity(initializer);
  }
  
  public render() {
    const readonly = this.props.readonly ?? true;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <div className={classes.join(" ")}>
        <div className={Style.Row}>
          <div className={Style.Table}>
            <table>
              <tbody>
                {this.props.block.content.value.map(this.renderRow)}
              </tbody>
            </table>
          </div>
          <Conditional condition={!readonly}>
            <Button icon={IconType.PLUS} onClick={this.eventAddColumnClick}>Column</Button>
          </Conditional>
        </div>
        <div className={Style.Row}>
          <Conditional condition={!readonly}>
            <Button icon={IconType.PLUS} onClick={this.eventAddRowClick}>Row</Button>
          </Conditional>
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
  
  private readonly renderColumn = (text: RichText, key: number = 0) => {
    return (
      <td key={key}>
        <EditText readonly={this.props.readonly} blacklist={TableBlock.blacklist} whitelist={TableBlock.whitelist}
                  onBlur={this.props.onBlur} onFocus={this.props.onFocus} onSelect={this.props.onSelect} onChange={this.eventChange} onSubmit={this.eventSubmit}>
          {text}
        </EditText>
      </td>
    );
  };
  
  private readonly eventAddRowClick = () => {
    const next_row = [];
    const prev_row = this.props.block.content.value[this.props.block.content.value.length - 1];
    
    for (let x = 0; x < prev_row.length; x++) {
      next_row.push(new RichText({...prev_row[x], value: ""}));
    }
    
    this.props.block.content.value.push(next_row);
    this.props.onChange(this.props.block);
  };
  
  private readonly eventAddColumnClick = () => {
    for (let y = 0; y < this.props.block.content.value.length; y++) {
      const prev_column = this.props.block.content.value[y][this.props.block.content.value[y].length - 1];
      this.props.block.content.value[y].push(new RichText({...prev_column, value: ""}));
    }
    this.props.onChange(this.props.block);
  };
  
  private readonly eventChange = (text: RichText, component: EditText) => {
    this.props.onChange(this.props.block.replaceText(component.text, text));
  };
  
  private readonly eventSubmit = (component: EditText) => {
    this.props.onSubmit?.(this.props.block, component);
  };
  
}

export interface TableBlockProps extends PageExplorerBlockProps<PageBlockType.TABLE> {

}

interface State {

}
