import FatalException from "exceptions/FatalException";
import React from "react";
import ClipboardDataType from "../../../common/enums/ClipboardDataType";
import Util from "../../../common/services/Util";
import RichText, {RichTextSelection} from "../../classes/RichText/RichText";
import RichTextCharacter, {RichTextCharacterContent, RichTextFragmentContent} from "../../classes/RichText/RichTextCharacter";
import RichTextDecoration, {RichTextDecorationObject, RichTextDecorationKeys} from "../../classes/RichText/RichTextDecoration";
import RichTextSection, {RichTextSectionContent} from "../../classes/RichText/RichTextSection";
import KeyboardCommand from "../../enums/KeyboardCommand";
import Helper from "../../Helper";
import Component from "../Application/Component";
import Style from "./EditText.module.scss";
import History from "../../../common/classes/History";

export default class EditText extends Component<EditTextProps, State> {

  constructor(props: EditTextProps) {
    super(props);
    this.state = {
      ref:     React.createRef(),
      history: new History(),
    };
  }

  public get text() {
    return this.props.children as EditTextProps["children"];
  };

  public getSelection(): EditTextSelection {
    const {focusNode, anchorNode, focusOffset = 0, anchorOffset = 0} = getSelection() ?? {};

    if (this.state.ref.current && this.state.ref.current === document.activeElement && focusNode && anchorNode) {
      const {section: focusSection, character: focusPosition} = this.getSectionAndCharacterByNode(focusNode, focusOffset);
      const {section: anchorSection, character: anchorPosition} = this.getSectionAndCharacterByNode(anchorNode, anchorOffset);

      if (anchorSection > focusSection || (anchorSection === focusSection && anchorPosition > focusPosition)) {
        return {section: focusSection, character: focusPosition, section_offset: anchorSection, character_offset: anchorPosition, forward: false};
      }

      return {section: anchorSection, character: anchorPosition, section_offset: focusSection, character_offset: focusPosition, forward: true};
    }

    return this.props.selection;
  };

  private getSectionAndCharacterByNode(node: Node, offset: number = 0) {
    if (!this.state.ref.current) throw Error("Component is not being rendered.");
    const value = {section: 0, character: offset};

    while (true) {
      const parent = node.parentNode;
      if (!parent || node === this.state.ref.current) break;

      for (let i = 0; parent.childNodes.length; i++) {
        const child = parent.childNodes.item(i);

        if (i > 0) {
          if (parent === this.state.ref.current) {
            value.section++;
          }
          else if (node instanceof HTMLSpanElement && node.classList.contains(Style.Line)) {
            value.character++;
          }
        }
        if (node === child) {
          node = parent;
          break;
        }
        if (parent !== this.state.ref.current) {
          value.character += Helper.getNodeTextLength(child);
        }
      }
    }

    return value;
  }

  private getNodeBySectionAndCharacter(section_id: number, character_id: number) {
    if (!this.state.ref.current) throw Error("Component is not being rendered.");

    const section = this.getSectionElement(section_id);
    const value = {node: section, offset: character_id};
    for (let i = 0; i < section.childNodes.length; i++) {
      const line = section.children[i];
      const text_list = this.getNodeText(line);

      if (text_list.length) {
        for (let j = 0; j < text_list.length; j++) {
          const text = text_list[j];

          if (text.length >= value.offset) {
            return {node: text, offset: value.offset};
          }
          else {
            value.offset -= text.length;
          }
        }
      }
      else if (!value.offset) {
        return {node: line, offset: 0};
      }

      value.offset--;
    }

    return value;
  }

  private getSectionElement(index: number) {
    if (!this.state.ref.current) throw Error("Component is not being rendered.");

    const section = this.text.getSection(index);
    const [tag, ...tag_list] = section.element;

    let value = this.state.ref.current.querySelector(`${tag}:nth-child(${index + 1})`);
    if (!value) throw new FatalException("RichTextEditor could not find text section node.", "If you have not been manipulating the window, please reload the page to continue.");

    for (let j = 0; j < tag_list.length; j++) {
      value = value.querySelector(tag_list[j]);
      if (!value) throw new FatalException("RichTextEditor could not find text section sub node.", "If you have not been manipulating the window, please reload the page to continue.");
    }

    return value;
  }

  private getNodeText(node: Node) {
    const value = [] as Text[];

    for (let i = 0; i < node?.childNodes.length; i++) {
      const child = node.childNodes.item(i);
      if (!child) continue;
      if (child instanceof Text) {
        value.push(child);
      }
      else {
        value.push(...this.getNodeText(child));
      }
    }

    return value;
  }

  public isDecorationDisabled(decoration: RichTextDecorationKeys) {
    return (this.props.whitelist?.length && !this.props.whitelist.includes(decoration) || this.props.blacklist?.includes(decoration));
  };

  public focus() {
    this.state.ref.current?.focus();
    const {section, section_offset, character, character_offset, forward} = this.props.selection;
    const {node: start_node, offset: start_offset} = this.getNodeBySectionAndCharacter(section, character);
    const {node: end_node, offset: end_offset} = this.getNodeBySectionAndCharacter(section_offset, character_offset);
    const args: [Node, number, Node, number] = forward ? [start_node, start_offset, end_node, end_offset] : [end_node, end_offset, start_node, start_offset];

    getSelection()?.setBaseAndExtent(...args);
  }

  public selectAll() {
    const selection = {section: 0, character: 0, section_offset: this.text.section_list.length - 1, character_offset: this.text.getSection(this.text.section_list.length - 1).length, forward: true};
    this.props.onSelect(selection, this);
    return selection;
  }

  private handleTextChange(selection: EditTextSelection) {
    this.props.onTextChange(this.text.clone(), selection, this);
    const history = this.state.history.push({selection, value: this.text});
    this.setState({history: history});
  }

  public insertText(text: string, selection: EditTextSelection = this.getSelection(), decoration: RichTextDecoration = this.props.decoration) {
    if (text.length > 1) {
      const fragment = [] as RichTextCharacter[];
      for (let i = 0; i < text.length; i++) {
        fragment.push(new RichTextCharacter({value: text[i], decoration}));
      }
      this.write(fragment, selection);
    }
    else {
      this.write(new RichTextCharacter({value: text, decoration}));
    }
  };

  public insertHTML(html: string | HTMLElement, selection: EditTextSelection = this.getSelection()) {
    const node = typeof html === "string" ? Helper.createElementWithContent("div", {}, html) : html;
    document.body.append(node);
    node.hidden = true;
    const parsed = RichText.parseHTML(node);
    node.remove();
    this.write(parsed.section_list.length > 1 ? parsed.section_list : parsed.section_list[0].character_list, selection);
  }

  public write(insert: RichTextCharacter | RichTextSection | (RichTextCharacter | RichTextSection)[], selection: EditTextSelection = this.getSelection()) {
    selection = this.text.replace(insert, selection);
    this.handleTextChange(selection);
  };

  public decorate(decoration: Initializer<RichTextDecoration>, selection: EditTextSelection = this.getSelection()) {
    const sanitized = this.sanitizeDecoration(decoration);
    this.props.onDecorationChange(sanitized, this);
    this.handleTextChange(this.text.decorate(sanitized, selection));
  };

  public delete(selection: EditTextSelection = this.getSelection()) {
    this.handleTextChange(this.text.remove(selection));
  }

  public deleteForward(selection: EditTextSelection = this.getSelection(), word: boolean = false) {
    if (!this.text.size) return;
    if (selection.section === selection.section_offset && selection.character === selection.character_offset) {
      const section = this.text.getSection(selection.section);
      if (selection.character === section.length) {
        selection.section_offset++;
        selection.character_offset = 0;
      }
      else if (word) {
        const character = section.getCharacter(selection.character);
        const pattern = character.value.match(/\W/) ? /\w/ : /\W/;
        selection.character_offset = section.findCharacter(/\S/, selection.character_offset)?.index ?? section.length;
        selection.character_offset = section.findCharacter(pattern, selection.character_offset)?.index ?? section.length;
      }
      else {
        selection.character_offset++;
      }
    }
    this.delete(selection);
  };

  public deleteBackward(selection: EditTextSelection = this.getSelection(), word: boolean = false) {
    if (!this.text.size) return;
    if (selection.section === selection.section_offset && selection.character === selection.character_offset) {
      const section = this.text.getSection(selection.section);
      if (selection.character === 0) {
        if (selection.section === 0) return;
        selection.section--;
        selection.character = section.length;
      }
      else if (word) {
        const character = section.getCharacter(selection.character);
        const pattern = character.value.match(/\W/) ? /\w/ : /\W/;
        selection.character = section.findCharacter(/\S/, selection.character, false)?.index ?? 0;
        selection.character = section.findCharacter(pattern, selection.character, false)?.index ?? 0;
      }
      else {
        selection.character--;
      }
    }
    this.delete(selection);
  };

  public preview(decoration?: Initializer<RichTextDecoration>, selection?: EditTextSelection) {
    if (!decoration) return this.loadHistory();
    const sanitized = this.sanitizeDecoration(decoration);
    const selected = this.text.decorate(sanitized, selection ?? this.getSelection());
    this.props.onDecorationChange(sanitized, this);
    this.props.onTextChange(this.text.clone(), selected, this);
  }

  public loadHistory(pointer: number = this.state.history.pointer) {
    const history = this.state.history.loadPoint(pointer);
    this.props.onDecorationChange(history.value.value.getDecoration(history.value.selection) ?? this.props.decoration, this);
    this.props.onTextChange(history.value.value, history.value.selection, this);
    return this.setState({history});
  }

  private sanitizeDecoration({...decoration}: Initializer<RichTextDecoration>) {
    const keys = Util.getProperties(decoration);

    if (this.props.whitelist?.length) {
      for (let i = 0; i < keys.length; i++) {
        const key = keys.at(i);
        if (!key || this.props.whitelist.includes(key)) continue;
        keys.splice(i--, 1);
        delete decoration[key];
      }
    }

    if (this.props.blacklist?.length) {
      for (let i = 0; i < keys.length; i++) {
        const key = keys.at(i);
        if (!key || !this.props.blacklist.includes(key)) continue;
        keys.splice(i--, 1);
        delete decoration[key];
      }
    }

    return new RichTextDecoration(decoration);
  }

  public componentDidMount(): void {
    return this.setState({history: this.state.history.push({selection: this.props.selection, value: this.text.clone()})});
  }

  public componentDidUpdate(prevProps: Readonly<EditTextProps>, prevState: Readonly<State>, snapshot?: any): void {
    try {
      if (this.state.ref.current === document.activeElement) {
        this.focus();
      }
    }
    catch (error) {
      console.error(error);
      console.log(document.activeElement);
      console.log(this.props.selection);
      console.log(this.getNodeBySectionAndCharacter(this.props.selection.section, this.props.selection.character));
      console.log(this.getNodeBySectionAndCharacter(this.props.selection.section_offset, this.props.selection.character_offset));
    }
  }

  public render() {
    const readonly = this.props.readonly ?? true;
    const classes = [Style.Component];
    const content = this.text.toObject(this.getSelection());
    if (this.props.className) classes.push(this.props.className);
    if (this.props.readonly ?? true) classes.push(Style.Readonly);
    if (!this.text.length) classes.push(Style.Empty);

    return Helper.renderReactElementList(content.element, {
      ref:                            this.state.ref,
      className:                      classes.join(" "),
      contentEditable:                !readonly,
      suppressContentEditableWarning: !readonly,
      onBlur:                         this.eventBlur,
      onFocus:                        this.eventFocus,
      onSelect:                       this.eventSelect,
      onDragStart:                    this.eventDragStart,
      onDrop:                         this.eventDrop,
      onCopy:                         this.eventCopy,
      onPaste:                        this.eventPaste,
      onCut:                          this.eventCut,
      onKeyDown:                      this.eventKeyDown,
      onKeyPress:                     this.eventKeyPress,
      children:                       content.section_list.length
                                        ? content.section_list.map(this.renderReactSection)
                                        : this.renderReactSection(new RichTextSection().toObject()),
    });
  }

  private renderReactSection = (section: RichTextSectionContent, key: number = 0) => {
    const classes = [Style.Section];
    if (!section.character_list?.length) classes.push(Style.Empty);

    const props: React.HTMLProps<HTMLElement> = {
      key:       key,
      className: classes.join(" "),
      children:  section.character_list.map(this.renderReactLine),
    };

    return Helper.renderReactElementList(section.element, props, key);
  };

  private renderReactLine = (line: RichTextCharacterContent, key: number = 0) => {
    return (
      <span key={key} className={Style.Line}>
        {line.fragment_list.map(this.renderReactFragment)}
      </span>
    );
  };

  private renderReactFragment = ({decoration, ...fragment}: RichTextFragmentContent, key: number = 0): React.ReactNode => {
    if (decoration.bold) return <b key={key}>{this.renderReactFragment({...fragment, decoration: {...decoration, bold: false}})}</b>;
    if (decoration.code) return <code key={key}>{this.renderReactFragment({...fragment, decoration: {...decoration, code: false}})}</code>;
    if (decoration.mark) return <mark key={key}>{this.renderReactFragment({...fragment, decoration: {...decoration, mark: false}})}</mark>;
    if (decoration.italic) return <i key={key}>{this.renderReactFragment({...fragment, decoration: {...decoration, italic: false}})}</i>;
    if (decoration.underline) return <u key={key}>{this.renderReactFragment({...fragment, decoration: {...decoration, underline: false}})}</u>;
    if (decoration.strikethrough) return <s key={key}>{this.renderReactFragment({...fragment, decoration: {...decoration, strikethrough: false}})}</s>;
    if (decoration.link) return <a className={Style.Link} href={decoration.link} key={key}>{this.renderReactFragment({...fragment, decoration: {...decoration, link: ""}})}</a>;

    const classes = [Style.Text] as string[];
    if (decoration.selected && Helper.getActiveElement() === this.state.ref.current) classes.push(Style.Selected);

    return (
      <span key={key} className={classes.join(" ")} data-fragment={key} style={new RichTextDecoration(decoration).toCSSProperties()}>
        {this.renderReactText(fragment.text)}
      </span>
    );
  };

  private renderReactText = (text: string) => {
    return text.length ? Helper.renderHTMLText(text) : <br/>;
  };

  public readonly renderHTML = (selection: EditTextSelection) => {
    const content = this.text.slice(selection).toObject();
    return Helper.renderHTMLElementList(content.element, {class: "text"}, ...content.section_list.map(this.renderHTMLSection));
  };

  private readonly renderHTMLSection = (section: RichTextSectionContent) => {
    const list = [];
    for (let j = 0; j < section.character_list.length; j++) {
      const line = section.character_list.at(j);
      if (!line) continue;
      list.push(this.renderHTMLLine(line));
    }

    return Helper.renderHTMLElementList(section.element, {class: "text"}, ...section.character_list.map(this.renderHTMLLine));
  };

  private readonly renderHTMLLine = (line: RichTextCharacterContent) => {
    const list = [];
    for (let i = 0; i < line.fragment_list.length; i++) {
      const fragment = line.fragment_list.at(i);
      if (!fragment) continue;
      list.push(this.renderHTMLFragment(fragment));
    }
    return Helper.createElementWithChildren("span", {class: "line"}, ...list);
  };

  private readonly renderHTMLFragment = ({decoration, ...segment}: RichTextFragmentContent): Node => {
    if (decoration.bold) return Helper.createElementWithChildren("b", {}, this.renderHTMLFragment({...segment, decoration: {...decoration, bold: false}}));
    if (decoration.code) return Helper.createElementWithChildren("code", {}, this.renderHTMLFragment({...segment, decoration: {...decoration, code: false}}));
    if (decoration.mark) return Helper.createElementWithChildren("mark", {}, this.renderHTMLFragment({...segment, decoration: {...decoration, mark: false}}));
    if (decoration.italic) return Helper.createElementWithChildren("i", {}, this.renderHTMLFragment({...segment, decoration: {...decoration, italic: false}}));
    if (decoration.underline) return Helper.createElementWithChildren("u", {}, this.renderHTMLFragment({...segment, decoration: {...decoration, underline: false}}));
    if (decoration.strikethrough) return Helper.createElementWithChildren("s", {}, this.renderHTMLFragment({...segment, decoration: {...decoration, strikethrough: false}}));
    if (decoration.link) return Helper.createElementWithChildren("a", {"href": decoration.link}, this.renderHTMLFragment({...segment, decoration: {...decoration, link: ""}}));

    return this.renderHTMLText(segment.text, decoration);
  };

  private readonly renderHTMLText = (text: string, decoration?: RichTextDecorationObject) => {
    const node = new RichTextDecoration(decoration).toNode("span");
    node.append(document.createTextNode(Helper.renderHTMLText(text)));
    return node;
  };

  private readonly eventKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    this.write(new RichTextCharacter({value: event.key, decoration: this.props.decoration}));
  };

  private readonly eventKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    this.props.onKeyDown?.(event, this);

    if (!event.defaultPrevented) {
      this.handleKeyDown(event);
    }

    if (!event.bubbles) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  };

  private readonly handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const command = Helper.getKeyboardEventCommand(event);
    event.bubbles = false;

    switch (command) {
      case KeyboardCommand.NEXT_FOCUS:
        return this.insertText(RichTextCharacter.tab);
      case KeyboardCommand.SELECT_ALL:
        return this.selectAll();
      case KeyboardCommand.NEW_LINE:
      case KeyboardCommand.NEW_LINE_ALT:
        return this.insertText(RichTextCharacter.linebreak);
      case KeyboardCommand.NEW_PARAGRAPH:
      case KeyboardCommand.NEW_PARAGRAPH_ALT:
        return this.write(new RichTextSection());
      case KeyboardCommand.DELETE_FORWARD:
        return this.deleteForward();
      case KeyboardCommand.DELETE_BACKWARD:
        return this.deleteBackward();
      case KeyboardCommand.DELETE_WORD_FORWARD:
        return this.deleteForward(this.getSelection(), true);
      case KeyboardCommand.DELETE_WORD_BACKWARD:
        return this.deleteBackward(this.getSelection(), true);
      case KeyboardCommand.REDO:
      case KeyboardCommand.REDO_ALT:
        return this.loadHistory(this.state.history.pointer + 1);
      case KeyboardCommand.UNDO:
      case KeyboardCommand.UNDO_ALT:
        return this.loadHistory(this.state.history.pointer - 1);
      case KeyboardCommand.BOLD_TEXT:
        return this.decorate({...this.props.decoration, bold: !this.text.hasDecoration("bold", this.getSelection())});
      case KeyboardCommand.ITALIC_TEXT:
        return this.decorate({...this.props.decoration, italic: !this.text.hasDecoration("italic", this.getSelection())});
      case KeyboardCommand.UNDERLINE_TEXT:
        return this.decorate({...this.props.decoration, underline: !this.text.hasDecoration("underline", this.getSelection())});
      case KeyboardCommand.MARK_TEXT:
        return this.decorate({...this.props.decoration, mark: !this.text.hasDecoration("mark", this.getSelection())});
      case KeyboardCommand.CODE_TEXT:
        return this.decorate({...this.props.decoration, code: !this.text.hasDecoration("code", this.getSelection())});
      case KeyboardCommand.STRIKETHROUGH_TEXT:
        return this.decorate({...this.props.decoration, strikethrough: !this.text.hasDecoration("strikethrough", this.getSelection())});
    }

    event.bubbles = true;
  };

  private readonly eventBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    this.props.onBlur?.(event, this);
  };

  private readonly eventFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    this.props.onFocus?.(event, this);
  };

  private readonly eventSelect = () => {
    if (this.state.ref.current !== document.activeElement) return;
    const selection = this.getSelection();
    const {section, section_offset, character, character_offset, forward} = this.props.selection;
    const {section: prev_section, section_offset: prev_section_offset, character: prev_character, character_offset: prev_character_offset, forward: prev_forward} = selection;
    if (prev_section !== section || prev_section_offset !== section_offset || prev_character !== character || prev_character_offset !== character_offset || prev_forward !== forward) {
      this.props.onSelect(selection, this);
      this.props.onDecorationChange(this.text.getDecoration(selection) ?? this.props.decoration, this);
    }
  };

  private readonly eventDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  private readonly eventDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  private readonly eventCopy = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    event.clipboardData.setData("text/plain", this.renderHTML(this.getSelection()).innerText);
    event.clipboardData.setData("text/html", this.renderHTML(this.getSelection()).innerHTML);
  };

  private readonly eventCut = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    event.clipboardData.setData("text/plain", this.renderHTML(this.getSelection()).innerText);
    event.clipboardData.setData("text/html", this.renderHTML(this.getSelection()).innerHTML);
    this.write([]);
  };

  private readonly eventPaste = async (event: React.ClipboardEvent) => {
    event.preventDefault();

    if (event.clipboardData.types.includes(ClipboardDataType.FILES)) return;
    if (event.clipboardData.types.includes(ClipboardDataType.TEXT_HTML)) {
      const capture = event.clipboardData.getData(ClipboardDataType.TEXT_HTML).match(/<!--StartFragment-->(?<html>.*)<!--EndFragment-->/);
      if (capture?.groups?.html) {
        return this.insertHTML(capture.groups.html);
      }
    }

    return this.insertText(event.clipboardData.getData(ClipboardDataType.TEXT_PLAIN));
  };
}

export interface EditTextSelection extends RichTextSelection {
  forward: boolean;
}

export interface EditTextProps {
  children: RichText;
  className?: string;

  selection: EditTextSelection;
  decoration: RichTextDecoration;

  readonly?: boolean;
  whitelist?: RichTextDecorationKeys[];
  blacklist?: RichTextDecorationKeys[];

  onBlur?(event: React.FocusEvent<HTMLDivElement>, component: EditText): void;
  onFocus?(event: React.FocusEvent<HTMLDivElement>, component: EditText): void;
  onKeyDown?(event: React.KeyboardEvent<HTMLDivElement>, component: EditText): boolean | void;

  onSelect(selection: EditTextSelection, component: EditText): void;
  onTextChange(text: RichText, selection: EditTextSelection, component: EditText): void;
  onDecorationChange(decoration: RichTextDecoration, component: EditText): void;
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
  history: History<{selection: EditTextSelection, value: RichText}>;
}
