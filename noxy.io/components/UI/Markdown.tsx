import React from "react";
import Style from "./Markdown.module.scss";
import FatalException from "../../exceptions/FatalException";
import _ from "lodash";

export default class Markdown extends React.Component<MarkdownProps, State> {

  constructor(props: MarkdownProps) {
    super(props);
  }

  private readonly convertSegmentToHierarchy = (content: string, pattern: string) => {
    return _.reduce(content.split(new RegExp(`\\n(?=${pattern})`)), (result, value) => {
      const level = new RegExp(`^${pattern}`).exec(value)?.[0].split(new RegExp(`(?=${pattern})`))?.length ?? 1;
      this.getHierarchyLevel(result, level).push(value.replace(new RegExp(`^${pattern} +`), ""));
      return result;
    }, [] as DeepArray<string>);
  };

  private readonly getHierarchyLevel = (array: DeepArray<string>, level: number): string[] => {
    if (level === 1) return array as string[];
    if (!Array.isArray(array)) throw new FatalException("Could not delve into array");
    if (Array.isArray(array[array.length - 1])) return this.getHierarchyLevel(array[array.length - 1], level - 1);

    array.push([]);
    return this.getHierarchyLevel(array[array.length - 1], level - 1);
  };

  private readonly parseContent = (markdown: string) => {
    const segments = [] as React.ReactNode[];
    while (markdown.length > 0) {
      let result: RegExpMatchArray | null;

      // ----- Pre ----- //
      if (!!(result = RegExp("^```(?<type>.+)?\\n(?<content>[^\\n]*\\n)*?```(?=\\n|$)").exec(markdown))) {
        if (!result.groups || !result.groups.content) throw new FatalException(`Could not parse <pre> segment "${result[0]}"`);
        segments.push(this.renderPreSegment(result.groups as PreSegment, segments.length));
      }
      // ----- Unordered list ----- //
      else if (!!(result = RegExp("^(?<content>\\*+ (.|\\n)+?(?=\\n\\n|$))").exec(markdown))) {
        if (!result.groups || !result.groups.content) throw new FatalException(`Could not parse <ul> segment "${result[0]}"`);
        segments.push(this.renderUnorderedListSegment(this.convertSegmentToHierarchy((result.groups as Segment).content, "\\*+"), segments.length));
      }
      // ----- Ordered list ----- //
      else if (!!(result = RegExp("^(?<content>(?:\\d\.)+ (.|\\n)+?(?=\\n\\n|$))").exec(markdown))) {
        if (!result.groups || !result.groups.content) throw new FatalException(`Could not parse <ol> segment "${result[0]}"`);
        segments.push(this.renderOrderedListSegment(this.convertSegmentToHierarchy((result.groups as Segment).content, "(?:\\d\\.)+"), segments.length));
      }
      // ----- Blockquote ----- //
      else if (!!(result = RegExp("^(?<content>>+ (.|\\n)+?(?=\\n\\n|$))").exec(markdown))) {
        if (!result.groups || !result.groups.content) throw new FatalException(`Could not parse <blockquote> segment "${result[0]}"`);
        segments.push(this.renderBlockQuoteSegment(this.convertSegmentToHierarchy((result.groups as Segment).content, ">+"), segments.length));
      }
      // ----- Header ----- //
      else if (!!(result = RegExp("^(?<level>#{1,6}) (?<content>[^\\n]+)(?=\\n|$)").exec(markdown))) {
        if (!result.groups || !result.groups.level || !result.groups.content) throw new FatalException(`Could not parse <h> segment "${result[0]}"`);
        segments.push(this.renderHeaderSegment(result.groups as HeaderSegment, segments.length));
      }
      // ----- Paragraph ----- //
      else if (!!(result = RegExp("^(?<content>(.|\\n)+?(?=\\n\\n|$))").exec(markdown))) {
        if (!result.groups || !result.groups.content) throw new FatalException(`Could not parse <p> segment "${result[0]}"`);
        segments.push(this.renderParagraphSegment(result.groups as Segment, segments.length));
      }
      else {
        return segments.concat(<p>{markdown}</p>);
      }

      markdown = markdown.substr(result[0].length).replace(/^\s+/, "");
    }

    return segments;
  };


  private readonly renderPreSegment = (segment: PreSegment, index: number = 0) => {
    return <pre key={index}>{segment.content}</pre>;
  };

  private readonly renderHeaderSegment = (segment: HeaderSegment, index: number = 0) => {
    switch (segment.level.length) {
      case 1:
        return <h1 key={index}>{segment.content}</h1>;
      case 2:
        return <h2 key={index}>{segment.content}</h2>;
      case 3:
        return <h3 key={index}>{segment.content}</h3>;
      case 4:
        return <h4 key={index}>{segment.content}</h4>;
      case 5:
        return <h5 key={index}>{segment.content}</h5>;
      case 6:
        return <h6 key={index}>{segment.content}</h6>;
      default:
        throw new FatalException(`<h${segment.level.length}> cannot be rendered with content ${segment.content}.`);
    }
  };

  private readonly renderOrderedListSegment = (current: DeepArray<string>, index: number = 0) => {
    if (typeof current === "string") return <li key={index}>{this.parseContent(current)}</li>;

    return (
      <ol key={index}>
        {_.map(current, (value, index) => this.renderOrderedListSegment(value, index))}
      </ol>
    );
  };

  private readonly renderUnorderedListSegment = (current: DeepArray<string>, index: number = 0) => {
    if (typeof current === "string") return <li key={index}>{this.parseContent(current)}</li>;

    return (
      <ul key={index}>
        {_.map(current, (value, index) => this.renderUnorderedListSegment(value, index))}
      </ul>
    );
  };

  private readonly renderBlockQuoteSegment = (current: DeepArray<string>, index: number = 0) => {
    if (typeof current === "string") return this.parseContent(current);

    return (
      <blockquote key={index}>
        {_.map(current, (value, index) => this.renderBlockQuoteSegment(value, index))}
      </blockquote>
    );
  };

  private readonly renderParagraphSegment = (segment: Segment, index: number = 0) => {
    return <p key={index}>{_.map(segment.content.split("\n"), this.renderText)}</p>;
  };

  private static readonly PatternMap: {[key: string]: {width: number, value: number}} = {
    "`":         {width: 1, value: 1},
    "_":         {width: 1, value: 2},
    "__":        {width: 2, value: 4},
    "___":       {width: 3, value: 6},
    "\\*":       {width: 1, value: 2},
    "\\*\\*":    {width: 2, value: 4},
    "\\*\\*\\*": {width: 3, value: 6},
  };

  private readonly getCharacterTypeElement = (value: string, type: number, index: number = 0) => {
    if (type >= 4) return <strong key={index}>{this.getCharacterTypeElement(value, type - 4)}</strong>;
    if (type >= 2) return <i key={index}>{this.getCharacterTypeElement(value, type - 2)}</i>;
    if (type >= 1) return <code key={index}>{this.getCharacterTypeElement(value, type - 1)}</code>;
    return value.match(/^ +$/) ? value.replace(/ /g, "\u00a0") : value;
  };

  private readonly getEnclosedText = (value: string, pattern: string | string[]) => {
    let match: RegExpMatchArray | null;

    const regex = new RegExp(`(?<=^|[^${pattern}])${pattern}[^${pattern}]+${pattern}(?=[^${pattern}]|$)`, "g");
    const result = [] as [number, number][];

    while (!!(match = regex.exec(value))) {
      const {index = 0} = match;
      result.push([index, index + match[0].length]);
    }
    return result;
  };

  private readonly renderText = (value: string, index: number = 0) => {
    const characters = [] as number[];

    for (let pattern of Object.keys(Markdown.PatternMap)) {
      const type = Markdown.PatternMap[pattern];
      for (let [start, end] of this.getEnclosedText(value, pattern)) {
        for (let i = start; i < end; i++) {
          if (characters[i] === -1) continue;

          if (i >= start + type.width && i < end - type.width) {
            characters[i] = (characters[i] & type.value) == type.value ? Math.max(characters[i], type.value) : type.value;
          }
          else {
            characters[i] = -1;
          }
        }
      }
    }

    if (characters.length) {
      const t = _.reduce(
        value,
        (result, char, index) => {
          const current = characters[index] ?? 0;
          if (current === -1) return result;

          current === result.previous
            ? result.fragments[result.fragments.length - 1].value += char
            : result.fragments.push({element: current, value: char});

          result.previous = current;
          return result;
        },
        {fragments: [] as Text[], previous: NaN},
      );

      return (
        <span key={index}>{_.map(t.fragments, ({element, value}, index) => this.getCharacterTypeElement(value, element, index))}</span>
      );
    }

    return (
      <span key={index}>{value}</span>
    );
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

}

type Text = {element: number, value: string}
type Segment = {content: string}

type PreSegment = {type?: string} & Segment
type HeaderSegment = {level: string} & Segment;

export interface MarkdownProps {
  children: string
  className?: string
}

interface State {

}
