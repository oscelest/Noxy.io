import React from "react";
import Component from "../Application/Component";
import EditText, {EditTextSelection} from "../Text/EditText";
import FatalException from "../../exceptions/FatalException";
import PageBlockEntity from "../../entities/Page/PageBlockEntity";
import RichText, {RichTextObject} from "../../classes/RichText/RichText";
import Util from "../../../common/services/Util";
import {PageExplorerBlockProps} from "../Application/BlockEditor/BlockEditor";
import {RichTextDecorationKeys} from "../../classes/RichText/RichTextDecoration";
import Style from "./TableBlock.module.scss";

export default class TableBlock extends Component<TableBlockProps, State> {

  private static readonly blacklist: RichTextDecorationKeys[] = [];
  private static readonly whitelist: RichTextDecorationKeys[] = [];

  constructor(props: TableBlockProps) {
    super(props);
    this.state = {
      table: [],
    };
  }

  public getTextPosition(text: RichText) {
    for (let y = 0; y < this.state.table.length; y++) {
      const row = this.state.table.at(y);
      if (!row) continue;

      for (let x = 0; x < row.length; x++) {
        const column = row.at(x);
        if (column?.text.id !== text.id) continue;

        return {x, y};
      }
    }

    throw new Error("Could not find text in TableBlock.");
  }

  private static parseInitializerValue(entity?: PageBlockEntity<TableBlockInitializer>) {
    const value = {table: {}, x: entity?.content?.x ?? 0, y: entity?.content?.y ?? 0} as TableBlockContent;

    for (let y = 0; y < value.y; y++) {
      for (let x = 0; x < value.x; x++) {
        if (!entity?.content?.table[y]?.[x]) continue;
        value.table[y] = {...value.table[y], [x]: new RichText({element: "div", section_list: entity?.content?.table[y][x].section_list})};
      }
    }

    return value;
  }

  public componentDidMount() {
    const content = TableBlock.parseInitializerValue(this.props.block);
    const table = [] as TableBlockCell[][];

    for (let y = 0; y < content.y + 1; y++) {
      table[y] = [];
      for (let x = 0; x < content.x + 1; x++) {
        table[y][x] = {
          text:      content.table[y]?.[x] ?? new RichText(),
          selection: {section: 0, section_offset: 0, character: 0, character_offset: 0, forward: false},
        };
      }
    }

    this.setState({table});
    this.props.onPageBlockChange(new PageBlockEntity<TableBlockContent>({...this.props.block, content}));
  }

  public render() {
    const {readonly = true, block} = this.props;
    if (!block.content || !block.content?.x && !block.content?.y && readonly) return null;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return <div className={classes.join(" ")}>
      <div className={Style.Table}>
        <table>
          <tbody>
            {this.state.table.map(this.renderRow)}
          </tbody>
        </table>
      </div>
    </div>;
  }

  private readonly renderRow = (row: TableBlockCell[], y: number) => {
    const {readonly = true, block} = this.props;
    const cy = block.content?.y ?? 0;
    if (readonly && y >= cy) return null;

    return <tr key={y}>
      {row.map((value, x) => this.renderColumn(value, y, x))}
    </tr>;
  };

  private readonly renderColumn = (text: TableBlockCell, y: number, x: number) => {
    const {readonly = true, decoration, block, onAlignmentChange, onDecorationChange} = this.props;
    const cell = this.state.table[y][x];
    const cx = block.content?.x ?? 0;
    const cy = block.content?.y ?? 0;
    if (readonly && x >= cx) return null;

    const classes = [];
    const width = readonly ? cx - 1 : cx;
    const height = readonly ? cy - 1 : cy;

    classes.push(x < cx ? Style.BorderTop : Style.BorderTopMuted);
    classes.push(y < cy ? Style.BorderLeft : Style.BorderLeftMuted);
    if (x === width) classes.push(readonly ? Style.BorderRight : Style.BorderRightMuted);
    if (y === height) classes.push(readonly ? Style.BorderBottom : Style.BorderBottomMuted);
    if (x === 0 && y === 0) classes.push(Style.BorderTopLeft);
    if (x === width && y === 0) classes.push(Style.BorderTopRight);
    if (x === 0 && y === height) classes.push(Style.BorderBottomLeft);
    if (x === width && y === height) classes.push(Style.BorderBottomRight);

    return <td className={classes.join(" ")} key={x}>
      <EditText readonly={readonly} selection={cell.selection} decoration={decoration} whitelist={TableBlock.whitelist} blacklist={TableBlock.blacklist}
                onFocus={this.eventFocus} onSelect={this.eventSelect} onAlignmentChange={onAlignmentChange} onDecorationChange={onDecorationChange} onTextChange={this.eventChange}>
        {cell.text}
      </EditText>
    </td>;
  };

  private readonly eventFocus = (event: React.FocusEvent<HTMLDivElement>, component: EditText) => {
    this.props.onEditTextChange(component);
  };

  private readonly eventSelect = (selection: EditTextSelection, component: EditText) => {
    const {x, y} = this.getTextPosition(component.value);
    const row = this.state.table.at(y) ?? [];
    const column = Util.arrayReplace(row, x, {...row[x], selection});
    const table = Util.arrayReplace(this.state.table, y, column);
    this.setState({table});
  };

  private readonly eventChange = (text: RichText, selection: EditTextSelection, component: EditText) => {
    if (!this.props.block.content) throw new FatalException("Could not get block content.");
    const {x, y} = this.getTextPosition(component.value);
    const cx = this.props.block.content.x - 1;
    const cy = this.props.block.content.y - 1;
    const dx = Math.max(x, cx);
    const dy = Math.max(y, cy);

    const content = {...this.props.block.content, table: {...this.props.block.content.table, [y]: {...this.props.block.content.table[y], [x]: text}}};
    const next_state = {table: Util.arrayReplace(this.state.table, y, Util.arrayReplace(this.state.table[y], x, {text, selection}))} as State;

    if (text.size) {
      if (dy >= content.y || dx >= content.x) {
        for (let row = 0; row <= dy + 1; row++) {
          next_state.table[row] = next_state.table[row] ?? [];
          for (let col = 0; col <= dx + 1; col++) {
            next_state.table[row][col] = next_state.table[row][col] ?? {text: new RichText(), selection: {section: 0, section_offset: 0, character: 0, character_offset: 0, forward: false}};
          }
        }
        content.x = dx + 1;
        content.y = dy + 1;
      }
    }
    else if (dx === cx || dy === cy) {
      const columns = [] as boolean[];
      const rows = [] as boolean[];

      for (let row = 0; row < content.y; row++) {
        for (let col = 0; col < content.x; col++) {
          columns[col] = columns[col] || !!next_state.table[row][col].text.size;
          rows[row] = rows[row] || !!next_state.table[row][col].text.size;
        }
      }

      const row = rows.reduceRight((result, value, key) => !value && result === key + 1 ? key : result, rows.length);
      const col = columns.reduceRight((result, value, key) => !value && result === key + 1 ? key : result, columns.length);

      next_state.table = next_state.table.slice(0, row + 1);
      for (let i = 0; i < next_state.table.length; i++) {
        next_state.table[i] = next_state.table[i].slice(0, col + 1);
      }

      content.x = col;
      content.y = row;
      delete content.table[y][x];
    }

    this.props.onPageBlockChange(new PageBlockEntity<TableBlockContent>({...this.props.block, content}));
    this.setState(next_state);
  };
}


export interface TableBlockContent extends TableBlockBase {
  table: {[y: number]: {[x: number]: RichText}};
}

export interface TableBlockInitializer extends TableBlockBase {
  table: {[y: number]: {[x: number]: RichText}} | {[y: number]: {[x: number]: RichTextObject}};
}

interface TableBlockBase {
  x: number;
  y: number;
}

export interface TableBlockProps extends PageExplorerBlockProps<TableBlockContent> {

}

interface State {
  table: TableBlockCell[][];
}

interface TableBlockCell {
  selection: EditTextSelection;
  text: RichText;
}
