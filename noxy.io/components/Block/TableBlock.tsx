import React from "react";
import RichText, {RichTextObject} from "../../classes/RichText/RichText";
import IconType from "../../enums/IconType";
import Component from "../Application/Component";
import Conditional from "../Application/Conditional";
import {PageExplorerBlockProps} from "../Application/PageExplorer";
import Button from "../Form/Button";
import EditText, {EditTextSelection} from "../Text/EditText";
import Util from "../../../common/services/Util";
import Style from "./TableBlock.module.scss";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import {RichTextDecorationKeys} from "../../classes/RichText/RichTextDecoration";

export default class TableBlock extends Component<TableBlockProps, State> {

  private static readonly blacklist: RichTextDecorationKeys[] = [];
  private static readonly whitelist: RichTextDecorationKeys[] = [];

  constructor(props: TableBlockProps) {
    super(props);
    this.state = {
      selection: [],
    };
  }

  public getContent() {
    if (!this.props.block.content) throw new Error(`Could not get TableBlock (id: ${this.props.block.id}) content`);
    return this.props.block.content;
  }

  public getTextPosition(text: RichText) {
    const content = this.getContent();

    for (let y = 0; y < content.table.length; y++) {
      const row = content.table.at(y);
      if (!row) continue;

      for (let x = 0; x < row.length; x++) {
        const column = row.at(x);
        if (column?.id !== text.id) continue;

        return {x, y};
      }
    }

    throw new Error("Could not find text in TableBlock.");
  }

  private getTable() {
    const table = [] as RichText[][];
    if (!this.props.block.content) return table;

    const content = this.getContent();
    for (let y = 0; y < content.y; y++) {
      table[y] = [];
      for (let x = 0; x < content.x; x++) {
        const value = content.table.at(y)?.at(x);

        if (!value) throw new Error(`Missing TableBlock RichText at Column ${y}, Row ${x}`);
        table[y][x] = value;
      }
    }

    return table;
  }

  public replaceTable(old_text: RichText, new_text: RichText) {
    const {x, y} = this.getTextPosition(old_text);
    const content = this.getContent();

    const value_x = Util.arrayReplace(content.table[y], x, new_text);
    const value_y = Util.arrayReplace(content.table, y, value_x);

    return new PageBlockEntity<TableBlockContent>({...this.props.block, content: {...content, table: value_y}});
  }

  private static parseInitializerValue(entity?: PageBlockEntity<TableBlockInitializer>) {
    const table = {table: [], x: entity?.content?.x ?? 1, y: entity?.content?.y ?? 1} as TableBlockContent;

    for (let y = 0; y < table.y; y++) {
      table.table[y] = [];
      const row = table.table.at(y);

      for (let x = 0; x < table.x; x++) {
        const column = row?.at(x);
        table.table[y][x] = column ? new RichText({section_list: column.section_list}) : new RichText();
      }
    }

    return table;
  }

  public componentDidMount() {
    this.props.onPageBlockChange(new PageBlockEntity<TableBlockContent>({
      ...this.props.block,
      content: TableBlock.parseInitializerValue(this.props.block),
    }));
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

  private readonly renderRow = (row: RichText[], y: number = 0) => {
    return (
      <tr key={y}>
        {row.map((value, x) => this.renderColumn(value, y, x))}
      </tr>
    );
  };

  private readonly renderColumn = (text: RichText, y: number = 0, x: number = 0) => {
    const {readonly, decoration, onDecorationChange} = this.props;
    const selection = this.state.selection.at(y)?.at(x) ?? {section: 0, section_offset: 0, character: 0, character_offset: 0, forward: false};

    return (
      <td key={x}>
        <EditText readonly={readonly} selection={selection} decoration={decoration} whitelist={TableBlock.whitelist} blacklist={TableBlock.blacklist}
                  onFocus={this.eventFocus} onSelect={this.eventSelect} onDecorationChange={onDecorationChange} onTextChange={this.eventChange}>
          {text}
        </EditText>
      </td>
    );
  };

  private readonly eventAddRowClick = () => {
    const content = this.getContent();

    const y = content.y + 1;
    const value = [...content.table, []] as RichText[][];
    for (let i = 0; i < content.x; i++) {
      value[content.y].push(new RichText());
    }

    this.props.onPageBlockChange(new PageBlockEntity<TableBlockContent>({...this.props.block, content: {...content, y, table: value}}));
  };

  private readonly eventAddColumnClick = () => {
    const content = this.getContent();

    const x = content.x + 1;
    const value = [...content.table] as RichText[][];
    for (let i = 0; i < content.y; i++) {
      value[i].push(new RichText());
    }

    this.props.onPageBlockChange(new PageBlockEntity<TableBlockContent>({...this.props.block, content: {...content, x, table: value}}));
  };

  private readonly eventFocus = (event: React.FocusEvent<HTMLDivElement>, component: EditText) => {
    this.props.onEditTextChange(component);
  };

  private readonly eventSelect = (selection: EditTextSelection, component: EditText) => {
    const {x, y} = this.getTextPosition(component.text);
    this.props.onDecorationChange(component.text.getDecoration(selection));

    const value_x = Util.arrayReplace(this.state.selection.at(y) ?? [], x, selection);
    const value_y = Util.arrayReplace(this.state.selection, y, value_x);
    this.setState({selection: value_y});
  };

  private readonly eventChange = (text: RichText, component: EditText) => {
    this.props.onPageBlockChange(this.replaceTable(component.text, text));
  };
}


export interface TableBlockContent extends TableBlockBase {
  table: RichText[][];
}

export interface TableBlockInitializer extends TableBlockBase {
  table: RichText[][] | RichTextObject[][];
}

interface TableBlockBase {
  x: number;
  y: number;
}

export interface TableBlockProps extends PageExplorerBlockProps<TableBlockContent> {

}

interface State {
  selection: EditTextSelection[][];
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
