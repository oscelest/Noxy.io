import React from "react";
import RichText from "../../classes/RichText/RichText";
import TablePageBlockEntity from "../../entities/Page/Block/TablePageBlockEntity";
import IconType from "../../enums/IconType";
import Component from "../Application/Component";
import Conditional from "../Application/Conditional";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import Button from "../Form/Button";
import EditText, {EditTextCommandList, EditTextSelection} from "../Text/EditText";
import Style from "./TableBlock.module.scss";

export default class TableBlock extends Component<TableBlockProps, State> {
  
  private static readonly blacklist: EditTextCommandList = [];
  private static readonly whitelist: EditTextCommandList = [];
  
  constructor(props: TableBlockProps) {
    super(props);
    this.state = {
      selection: {section: 0, section_offset: 0, character: 0, character_offset: 0, forward: true},
    };
  }
  
  private getTable() {
    const table = [] as RichText[][];
    
    for (let y = 0; y < this.props.block.content.y; y++) {
      table[y] = [];
      for (let x = 0; x < this.props.block.content.x; x++) {
        const value = this.props.block.content.value.at(y)?.at(x);
        if (!value) throw new Error(`Missing TableBlock RichText at Column ${y}, Row ${x}`);
        table[y][x] = value;
      }
    }
    
    return table;
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
                {this.getTable().map(this.renderRow)}
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
        <EditText readonly={this.props.readonly} selection={this.state.selection} decoration={this.props.decoration} whitelist={TableBlock.whitelist} blacklist={TableBlock.blacklist}
                  onBlur={this.props.onBlur} onFocus={this.props.onFocus} onChange={this.eventChange}>
          {text}
        </EditText>
      </td>
    );
  };
  
  private readonly eventAddRowClick = () => {
    this.props.block.content.y++;
    this.props.onChange(this.props.block);
  };
  
  private readonly eventAddColumnClick = () => {
    this.props.block.content.x++;
    this.props.onChange(this.props.block);
  };
  
  private readonly eventChange = (selection: EditTextSelection, text: RichText, component: EditText) => {
    this.setState({selection});
    this.props.onChange(this.props.block.replaceText(component.text, text));
  };
  
}

export interface TableBlockProps extends PageExplorerBlockProps<TablePageBlockEntity> {

}

interface State {
  selection: EditTextSelection;
}


// private readonly handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, component: EditText) => {
//   const command = Helper.getKeyboardEventCommand(event);
//   event.bubbles = false;
//
//   switch (command) {
//     case KeyboardCommand.ARROW_UP:
//       if (this.shiftVerticallyCursorBy(component, -1)) return;
//       break;
//     case KeyboardCommand.ARROW_DOWN:
//       if (this.shiftVerticallyCursorBy(component, 1)) return;
//       break;
//     case KeyboardCommand.ARROW_LEFT:
//       if (this.shiftHorizontallyCursorBy(component, -1)) return;
//       break;
//     case KeyboardCommand.ARROW_RIGHT:
//       if (this.shiftHorizontallyCursorBy(component, 1)) return;
//       break;
//     case KeyboardCommand.INDENT:
//       return this.shiftLevelBy(component, 1);
//     case KeyboardCommand.OUTDENT:
//       return this.shiftLevelBy(component, -1);
//     case KeyboardCommand.NEW_LINE:
//     case KeyboardCommand.NEW_LINE_ALT:
//       return this.insertNewContent(component);
//   }
//
//   event.bubbles = true;
// };

// private readonly shiftVerticallyCursorBy = (component: EditText, value: number) => {
//   const {forward, start, end} = component.getSelection();
//   const index = this.getIndex(component.text) + value;
//   if (index < 0 || index > this.props.block.content.value.length - 1) return false;
//
//   const point = Util.clamp(forward ? end : start, this.props.block.content.value[index].length, 0);
//   this.setState({focus: this.props.block.content.value[index], selection: {start: point, end: point, forward: true}});
//   return true;
// };
//
// private readonly shiftHorizontallyCursorBy = (component: EditText, value: number) => {
//   const index = this.getIndex(component.text);
//   const selection = component.getSelection();
//   const point = (selection.forward ? selection.end : selection.start) + value;
//   const next_state = {} as State;
//   if (point < 0 && index > 0) {
//     next_state.focus = this.props.block.content.value[index - 1];
//     next_state.selection = {start: next_state.focus.length, end: next_state.focus.length, forward: false};
//   }
//   else if (point > this.props.block.content.value[index].length && index < this.props.block.content.value.length - 1) {
//     next_state.focus = this.props.block.content.value[index + 1];
//     next_state.selection = {start: 0, end: 0, forward: true};
//   }
//   else {
//     return false;
//   }
//
//   this.setState(next_state);
//   return true;
// };
