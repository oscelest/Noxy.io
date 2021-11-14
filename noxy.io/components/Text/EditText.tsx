import FatalException from "exceptions/FatalException";
import React from "react";
import ClipboardDataType from "../../../common/enums/ClipboardDataType";
import Util from "../../../common/services/Util";
import RichText, {RichTextSelection} from "../../classes/RichText/RichText";
import RichTextCharacter, {RichTextCharacterContent, RichTextFragmentContent} from "../../classes/RichText/RichTextCharacter";
import RichTextDecoration, {RichTextDecorationObject} from "../../classes/RichText/RichTextDecoration";
import RichTextSection, {RichTextSectionContent} from "../../classes/RichText/RichTextSection";
import KeyboardCommand from "../../enums/KeyboardCommand";
import Helper from "../../Helper";
import Component from "../Application/Component";
import Style from "./EditText.module.scss";

export default class EditText extends Component<EditTextProps, State> {
  
  constructor(props: EditTextProps) {
    super(props);
    this.state = {
      ref: React.createRef(),
    };
  }
  
  public get text() {
    return this.props.children as EditTextProps["children"];
  };
  
  public getSelection(): EditTextSelection {
    const {focusNode, anchorNode, focusOffset = 0, anchorOffset = 0} = getSelection() ?? {};
    
    if (this.state.ref.current && focusNode && anchorNode) {
      const {section: focusSection, character: focusPosition} = this.getSectionAndCharacterByNode(focusNode, focusOffset);
      const {section: anchorSection, character: anchorPosition} = this.getSectionAndCharacterByNode(anchorNode, anchorOffset);
      
      return anchorSection <= focusSection && anchorPosition <= focusPosition
             ? {section: anchorSection, character: anchorPosition, section_offset: focusSection, character_offset: focusPosition, forward: true}
             : {section: focusSection, character: focusPosition, section_offset: anchorSection, character_offset: anchorPosition, forward: false};
    }
    
    return {section: 0, section_offset: 0, character_offset: 0, character: 0, forward: true};
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
  
  public isDecorationDisabled(decoration: keyof Initializer<RichTextDecoration>) {
    return !!(this.props.whitelist?.length && !this.props.whitelist.includes(decoration) || this.props.blacklist?.includes(decoration));
  };
  
  public focus() {
    this.state.ref.current?.focus();
  }
  
  public select(selection: EditTextSelection) {
    this.setState({selection});
  };
  
  public write(insert: RichTextCharacter | RichTextSection | (RichTextCharacter | RichTextSection)[], selection: EditTextSelection = this.getSelection()) {
    this.setState({selection: this.text.replace(insert, selection)});
    this.props.onChange(this.text.clone(), this);
  };
  
  public insertText(text: string, selection: EditTextSelection = this.getSelection()) {
    const decoration = this.text.section_list.at(selection.section)?.character_list.at(selection.character)?.decoration;
    
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
  
  // TODO: FIX
  // public insertHTML(html: string | HTMLElement, selection: EditTextSelection = this.getSelection()) {
  //   this.insert(RichText.parseHTML(html).value, selection);
  // }
  
  public decorate(decoration: Initializer<RichTextDecoration>, selection: EditTextSelection = this.getSelection()) {
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
    
    this.setState({selection: this.text.decorate(decoration, selection)});
    this.props.onChange(this.text.clone(), this);
  };
  
  public delete(selection: EditTextSelection = this.getSelection()) {
    this.setState({selection: this.text.remove(selection)});
    this.props.onChange(this.text.clone(), this);
  }
  
  public deleteForward(selection: EditTextSelection = this.getSelection(), word: boolean = false) {
    if (!this.text.length) return;
    if (selection.section === selection.section_offset && selection.character === selection.character_offset) {
      const section = this.text.getSection(selection.section);
      if (selection.character === section.length) {
        if (selection.section === this.text.section_list.length) return;
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
    if (!this.text.length) return;
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
  
  public componentDidUpdate(prevProps: Readonly<EditTextProps>, prevState: Readonly<State>, snapshot?: any): void {
    if (this.state.selection) {
      this.setState({selection: undefined});
    }
    else if (prevState.selection) {
      const {section, section_offset, character, character_offset, forward} = prevState.selection;
      const {node: start_node, offset: start_offset} = this.getNodeBySectionAndCharacter(section, character);
      const {node: end_node, offset: end_offset} = this.getNodeBySectionAndCharacter(section_offset, character_offset);
      forward ? getSelection()?.setBaseAndExtent(start_node, start_offset, end_node, end_offset) : getSelection()?.setBaseAndExtent(end_node, end_offset, start_node, start_offset);
      this.props.onSelect?.(prevState.selection, this);
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
    const props: React.HTMLProps<HTMLElement> = {
      key:       key,
      className: Style.Section,
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
    if (decoration.selected && this.props.active !== false) classes.push(Style.Selected);
    
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
        return this.select({
          section:          0,
          character:        0,
          section_offset:   this.text.section_list.length - 1,
          character_offset: this.text.getSection(this.text.section_list.length - 1).length,
          forward:          true,
        });
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
      case KeyboardCommand.BOLD_TEXT:
        return this.decorate({bold: !this.text.hasDecoration("bold", this.getSelection())});
      case KeyboardCommand.ITALIC_TEXT:
        return this.decorate({italic: !this.text.hasDecoration("italic", this.getSelection())});
      case KeyboardCommand.UNDERLINE_TEXT:
        return this.decorate({underline: !this.text.hasDecoration("underline", this.getSelection())});
      case KeyboardCommand.MARK_TEXT:
        return this.decorate({mark: !this.text.hasDecoration("mark", this.getSelection())});
      case KeyboardCommand.CODE_TEXT:
        return this.decorate({code: !this.text.hasDecoration("code", this.getSelection())});
      case KeyboardCommand.STRIKETHROUGH_TEXT:
        return this.decorate({strikethrough: !this.text.hasDecoration("strikethrough", this.getSelection())});
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
    if (this.state.selection) return;
    this.setState({selection: this.getSelection()});
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
  
  // TODO: FIX
  private readonly eventPaste = async (event: React.ClipboardEvent) => {
    event.preventDefault();
    if (event.clipboardData.types.includes(ClipboardDataType.FILES)) return;
    // if (event.clipboardData.types.includes(ClipboardDataType.TEXT_HTML)) {
    //   const html = event.clipboardData.getData(ClipboardDataType.TEXT_HTML).match(/<!--StartFragment-->(?<html>.*)<!--EndFragment-->/);
    //   if (html?.groups?.html) {
    //     return this.insertHTML(html.groups.html);
    //   }
    // }
    
    return this.insertText(event.clipboardData.getData(ClipboardDataType.TEXT_PLAIN));
  };
}

export interface EditTextSelection extends RichTextSelection {
  forward: boolean;
}

export type EditTextCommandList = (keyof Initializer<RichTextDecoration>)[];

export interface EditTextProps {
  active?: boolean;
  children: RichText;
  className?: string;
  readonly?: boolean;
  whitelist?: (keyof Initializer<RichTextDecoration>)[];
  blacklist?: (keyof Initializer<RichTextDecoration>)[];
  decoration: RichTextDecoration;
  
  onBlur?(event: React.FocusEvent<HTMLDivElement>, component: EditText): void;
  onFocus?(event: React.FocusEvent<HTMLDivElement>, component: EditText): void;
  onSelect?(selection: EditTextSelection, component: EditText): void;
  onKeyDown?(event: React.KeyboardEvent<HTMLDivElement>, component: EditText): boolean | void;
  
  onChange(text: RichText, component: EditText): void;
}

interface State {
  ref: React.RefObject<HTMLDivElement>;
  selection?: EditTextSelection;
}
