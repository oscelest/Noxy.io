import _ from "lodash";
import React from "react";
import FatalException from "../../exceptions/FatalException";
import Component from "../Application/Component";
import SpoilerText from "../Text/SpoilerText";
import Style from "./Markdown.module.scss";

export default class Markdown extends Component<MarkdownProps, State> {

  private static readonly PatternMap: {[key: string]: {width: number, value: number, pattern: RegExp}} = {
    "||":  {width: 2, value: 32, pattern: /(?<!\|)\|\|.+?\|\|(?!\|)/g},
    "__":  {width: 2, value: 16, pattern: /(?<!_)__.+?__(?!_)/g},
    "~~":  {width: 2, value: 8, pattern: /(?<!~)~~.+?~~(?!~)/g},
    "***": {width: 3, value: 6, pattern: /(?<!\*)\*\*\*.+?\*\*\*(?!\*)/g},
    "**":  {width: 2, value: 4, pattern: /(?<!\*)\*\*.+?\*\*(?!\*)/g},
    "*":   {width: 1, value: 2, pattern: /(?<!\*)\*.+?\*(?!\*)/g},
    "`":   {width: 1, value: 1, pattern: /(?<!`)`.+?`(?!`)/g},
  };

  private static readonly BlockQuoteRegex = new RegExp("^(?<content>>+ .+?(?=\\n\\n|$))", "s");
  private static readonly HorizontalRuleRegex = new RegExp("^(?<content>\\*{3,}|_{3,}|-{3,})(?=\\n|$)");
  private static readonly PreformattedRegex = new RegExp("^```(?<type>[^\\n]+)?\\n(?<content>.*)\\n```(?=\\n|$)", "s");
  private static readonly OrderedListRegex = new RegExp("^(?<content>(?:\\d\.)+ .+?(?=\\n\\n|$))", "s");
  private static readonly UnorderedListRegex = new RegExp("^(?<content>\\*+ .+?(?=\\n\\n|$))", "s");
  private static readonly HeaderRegex = new RegExp("^(?<level>#{1,6}) (?<content>.+?)(?=\\n|$)");
  private static readonly ParagraphRegex = new RegExp("^(?<content>.+?(?=\\n\\n|$))", "s");

  private static readonly LinkRegex = new RegExp("\\[(?<content>.+?)]\\((?<link>.+?)(?: \"(?<title>.+?)\")?\\)", "g");
  private static readonly ImageRegex = new RegExp("!\\[(?<content>.+?)]\\((?<link>.+?)(?: \"(?<title>.+?)\")?\\)", "g");

  constructor(props: MarkdownProps) {
    super(props);
  }

  private readonly convertSegmentToHierarchy = (content: string, pattern: string) => {
    return _.reduce(content.split(new RegExp(`\\n(?=${pattern})`)), (result, value) => {
      const level = new RegExp(`^${pattern}`).exec(value)?.[0].split(new RegExp(`(?=${pattern})`))?.length ?? 1;
      this.getHierarchyLevel(result, level).push(value.replace(new RegExp(`^${pattern} +`), ""));
      return result;
    }, [] as HierarchyArray<string>);
  };

  private readonly getHierarchyLevel = (array: HierarchyArray<string>, level: number): string[] => {
    if (level === 1) return array as string[];
    if (!Array.isArray(array)) throw new FatalException("Could not delve into array");
    if (Array.isArray(array[array.length - 1])) return this.getHierarchyLevel(array[array.length - 1], level - 1);

    array.push([]);
    return this.getHierarchyLevel(array[array.length - 1], level - 1);
  };

  private readonly getEnclosedText = (value: string, pattern: RegExp) => {
    let match: RegExpMatchArray | null;
    const result = [] as [number, number][];

    while (!!(match = pattern.exec(value))) {
      const {index = 0} = match;
      result.push([index, index + match[0].length]);
    }
    return result;
  };

  private readonly parseContent = (markdown: string) => {
    const segments = [] as React.ReactNode[];
    let result: RegExpMatchArray | null = null;

    do {
      // ----- Preformatted ----- //
      if (!!(result = Markdown.PreformattedRegex.exec(markdown))) {
        if (!result.groups || !result.groups.content) throw new FatalException(`Could not parse <pre> segment "${result[0]}"`);
        segments.push(this.renderPreformattedSegment(result.groups as PreformattedSegment, segments.length));
      }
      // ----- Horizontal rule ----- //
      else if (!!(result = Markdown.HorizontalRuleRegex.exec(markdown))) {
        segments.push(this.renderHorizontalRuleSegment(segments.length));
      }
      // ----- Blockquote ----- //
      else if (!!(result = Markdown.BlockQuoteRegex.exec(markdown))) {
        if (!result.groups || !result.groups.content) throw new FatalException(`Could not parse <blockquote> segment "${result[0]}"`);
        segments.push(this.renderBlockQuoteSegment(this.convertSegmentToHierarchy((result.groups as Segment).content, ">+"), segments.length));
      }
      // ----- Ordered list ----- //
      else if (!!(result = Markdown.OrderedListRegex.exec(markdown))) {
        if (!result.groups || !result.groups.content) throw new FatalException(`Could not parse <ol> segment "${result[0]}"`);
        segments.push(this.renderOrderedListSegment(this.convertSegmentToHierarchy((result.groups as Segment).content, "(?:\\d\\.)+"), segments.length));
      }
      // ----- Unordered list ----- //
      else if (!!(result = Markdown.UnorderedListRegex.exec(markdown))) {
        if (!result.groups || !result.groups.content) throw new FatalException(`Could not parse <ul> segment "${result[0]}"`);
        segments.push(this.renderUnorderedListSegment(this.convertSegmentToHierarchy((result.groups as Segment).content, "\\*+"), segments.length));
      }
      // ----- Header ----- //
      else if (!!(result = Markdown.HeaderRegex.exec(markdown))) {
        if (!result.groups || !result.groups.level || !result.groups.content) throw new FatalException(`Could not parse <h> segment "${result[0]}"`);
        segments.push(this.renderHeaderSegment(result.groups as HeaderSegment, segments.length));
      }
      // ----- Paragraph ----- //
      else if (!!(result = Markdown.ParagraphRegex.exec(markdown))) {
        if (!result.groups || !result.groups.content) throw new FatalException(`Could not parse <p> segment "${result[0]}"`);
        segments.push(this.renderParagraphSegment(result.groups as Segment, segments.length));
      }

      markdown = markdown.substr(result?.[0].length ?? Infinity).replace(/^\s+/, "");
    }
    while (result !== null);

    return segments;
  };

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        {this.parseContent(typeof this.props.children === "string" ? this.props.children.replace(/^\s+/, "").replace(/\n{2,}/g, "\n\n") : "Markdown could not be parsed")}
      </div>
    );
  };

  private readonly renderPreformattedSegment = (segment: PreformattedSegment, index: number = 0) => {
    return <pre key={index}>{segment.content}</pre>;
  };

  private readonly renderHorizontalRuleSegment = (index: number = 0) => {
    return <hr key={index}/>;
  };

  private readonly renderBlockQuoteSegment = (current: HierarchyArray<string>, index: number = 0) => {
    if (typeof current === "string") return this.parseContent(current);

    return (
      <blockquote key={index}>
        {_.map(current, (value, index) => this.renderBlockQuoteSegment(value, index))}
      </blockquote>
    );
  };

  private readonly renderOrderedListSegment = (current: HierarchyArray<string>, index: number = 0) => {
    if (typeof current === "string") return <li key={index}>{this.parseContent(current)}</li>;

    return (
      <ol key={index}>
        {_.map(current, (value, index) => this.renderOrderedListSegment(value, index))}
      </ol>
    );
  };

  private readonly renderUnorderedListSegment = (current: HierarchyArray<string>, index: number = 0) => {
    if (typeof current === "string") return <li key={index}>{this.parseContent(current)}</li>;

    return (
      <ul key={index}>
        {_.map(current, (value, index) => this.renderUnorderedListSegment(value, index))}
      </ul>
    );
  };

  private readonly renderHeaderSegment = (segment: HeaderSegment, index: number = 0) => {
    switch (segment.level.length) {
      case 1:
        return <h1 key={index}>{this.renderText(segment.content)}</h1>;
      case 2:
        return <h2 key={index}>{this.renderText(segment.content)}</h2>;
      case 3:
        return <h3 key={index}>{this.renderText(segment.content)}</h3>;
      case 4:
        return <h4 key={index}>{this.renderText(segment.content)}</h4>;
      case 5:
        return <h5 key={index}>{this.renderText(segment.content)}</h5>;
      case 6:
        return <h6 key={index}>{this.renderText(segment.content)}</h6>;
      default:
        throw new FatalException(`<h${segment.level.length}> cannot be rendered with content ${segment.content}.`);
    }
  };

  private readonly renderParagraphSegment = (segment: Segment, index: number = 0) => {
    return <p key={index}>{_.map(segment.content.split("\n"), this.renderText)}</p>;
  };

  private readonly renderText = (text: string, index: number = 0) => {
    const characters = [] as number[];

    for (let {pattern, width, value} of Object.values(Markdown.PatternMap)) {
      for (let [start, end] of this.getEnclosedText(text, pattern)) {
        for (let i = start; i < end; i++) {
          if (characters[i] === -1) continue;

          if (i >= start + width && i < end - width) {
            characters[i] = (characters[i] & value) == value ? Math.max(characters[i], value) : value + (characters[i] ?? 0);
          }
          else {
            characters[i] = -1;
          }
        }
      }
    }

    if (characters.length) {
      const {fragments} = _.reduce(
        text,
        (result, char, index) => {
          const current = characters[index] ?? 0;
          if (current === -1) return result;

          current === result.previous
            ? result.fragments[result.fragments.length - 1].text += char
            : result.fragments.push({value: current, text: char});

          result.previous = current;
          return result;
        },
        {fragments: [] as Text[], previous: NaN},
      );

      return (
        <span key={index}>{_.map(fragments, ({value, text}, index) => this.renderTextFragment(text, value, index))}</span>
      );
    }

    return (
      <span key={index}>{this.renderTextContent(text)}</span>
    );
  };

  private readonly renderTextFragment = (value: string, type: number, index: number = 0) => {
    if (type >= 32) return <SpoilerText key={index}>{this.renderTextFragment(value, type - 32)}</SpoilerText>;
    if (type >= 16) return <u key={index}>{this.renderTextFragment(value, type - 16)}</u>;
    if (type >= 8) return <s key={index}>{this.renderTextFragment(value, type - 8)}</s>;
    if (type >= 4) return <strong key={index}>{this.renderTextFragment(value, type - 4)}</strong>;
    if (type >= 2) return <i key={index}>{this.renderTextFragment(value, type - 2)}</i>;
    if (type >= 1) return <code key={index}>{this.renderTextFragment(value, type - 1)}</code>;
    return value.match(/^ +$/) ? value.replace(/ /g, "\u00a0") : this.renderTextContent(value);
  };


  private readonly renderTextContent = (text: string) => {
    const segments = [text] as React.ReactNode[];

    let result: RegExpMatchArray | null = null;
    do {
      result = null;
      for (let i = 0; i < segments.length; i++) {
        const text = segments[i];
        if (typeof text !== "string") continue;
        if (!!(result = Markdown.ImageRegex.exec(text))) {
          if (!result.groups || !result.groups.content || !result.groups.link) throw new FatalException(`Could not parse <img> segment "${result[0]}"`);
          const index = result.index ?? 0;
          const segment = result.groups as LinkSegment;

          segments.splice(i, 1, text.slice(0, index), <img src={segment.link} alt={segment.content} title={segment.title}/>, text.slice(index + result[0].length));
        }
        else if (!!(result = Markdown.LinkRegex.exec(text))) {
          if (!result.groups || !result.groups.content || !result.groups.link) throw new FatalException(`Could not parse <a> segment "${result[0]}"`);
          const index = result.index ?? 0;
          const segment = result.groups as LinkSegment;

          segments.splice(i, 1, text.slice(0, index), <a href={segment.link} title={segment.title}>{segment.content}</a>, text.slice(index + result[0].length));
        }
      }
    }
    while (result !== null);

    return _.map(segments, (segment, index) => typeof segment === "object" ? {...segment, key: index} : segment);
  };

}

type Text = {value: number; text: string}
type Segment = {content: string}

type PreformattedSegment = {type?: string} & Segment
type LinkSegment = {link: string; title?: string} & Segment
type HeaderSegment = {level: string} & Segment;

export interface MarkdownProps {
  children: string
  className?: string
}

interface State {

}
