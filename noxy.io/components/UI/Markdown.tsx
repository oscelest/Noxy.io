import React from "react";
import Style from "./Markdown.module.scss";
import FatalException from "../../exceptions/FatalException";
import _ from "lodash";

export default class Markdown extends React.Component<MarkdownProps, State> {

  constructor(props: MarkdownProps) {
    super(props);
  }

  private readonly getMarkdown = () => {
    return typeof this.props.children === "string" ? this.props.children.replace(/\n+/g, "\n") : "Markdown could not be parsed";
  };

  private readonly parseContent = (markdown: string) => {
    const segments = [];
    while (markdown.length > 0) {
      let segment: RegExpMatchArray | null;

      if (!!(segment = RegExp("^(?<level>#{1,6}) (?<content>[^\\n]+)(?=\\n|$)").exec(markdown))) {
        if (!segment.groups || !segment.groups.level || !segment.groups.content) throw new FatalException(`Could not parse <h> segment "${segment[0]}"`);
        segments.push(this.renderHeaderSegment(segment.groups as HeaderSegment, segments.length));
      }
      else if (!!(segment = markdown.match(/^```(?<type>.+)?\n(?<content>[^\n]*\n)*?```(?=\n|$)/))) {
        if (!segment.groups || !segment.groups.content) throw new FatalException(`Could not parse <pre> segment "${segment[0]}"`);
        segments.push(this.renderPreSegment(segment.groups as PreSegment, segments.length));
      }
      else if (!!(segment = RegExp("^(?<content>>+ [^\\n]+(?=\\n|$)(?:(?:(?<=\\n)|\\n)>+ [^\\n]+)*)").exec(markdown))) {
        if (!segment.groups || !segment.groups.content) throw new FatalException(`Could not parse <blockquote> segment "${segment[0]}"`);
        segments.push(this.renderBlockQuoteSegment(segment.groups as BlockQuoteSegment, segments.length));
      }
      else if (!!(segment = markdown.match(/^(?<content>[^\n]+)(?=\n|$)/))) {
        if (!segment.groups || !segment.groups.content) throw new FatalException(`Could not parse <p> segment "${segment[0]}"`);
        segments.push(this.renderParagraphSegment(segment.groups as Segment, segments.length));
      }
      else {
        segments.push(markdown = "");
        break;
      }

      markdown = markdown.substr(segment[0].length + 1);
    }

    console.log(segments);
    return segments;
  };


  private readonly renderPreSegment = (segment: PreSegment, index: number = 0) => {
    return <pre key={index}>{segment.content}</pre>;
  };

  private readonly renderParagraphSegment = (segment: Segment, index: number = 0) => {
    return <p key={index}>{segment.content}</p>;
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

  private readonly renderBlockQuoteSegment = (segment: BlockQuoteSegment, index: number = 0) => {
    const hierarchy = _.reduce(segment.content.split("\n"), (result, value) => {
      const segment = _.last(result) ?? [];
      const level = value.match(/^>+/)?.[0]?.length ?? 1;

      if (segment.length === level) {
        segment[level - 1].push(value.replace(/^>+ +/, ""));
      }
      else if (segment.length < level) {
        for (let i = segment.length; i < level - 1; i++) segment[i] = [];
        segment[level - 1] = [value.replace(/^>+ +/, "")];
      }
      else {
        result[result.length] = Array(level - 1).fill([]);
        result[result.length - 1][level - 1] = [value.replace(/^>+ +/, "")];
      }

      return result;
    }, [[]] as string[][][]);

    return (
      <blockquote key={index}>
        {_.map(hierarchy, ([current, ...rest]) => this.renderBlockQuoteHierarchy(current, rest))}
      </blockquote>
    );
  };

  private readonly renderBlockQuoteHierarchy = (current: string[], [next, ...rest]: string[][]) => {
    if (!next) return _.map(current, (value, index) => <p key={index}>{value}</p>);

    return [
      _.map(current, (value, index) => <p key={index}>{value}</p>),
      <blockquote key={current.length}>{this.renderBlockQuoteHierarchy(next, rest)}</blockquote>,
    ];
  };

  public render() {
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        {this.parseContent(this.getMarkdown())}
      </div>
    );
  };

}

type Segment = {content: string}

type PreSegment = {type?: string} & Segment
type HeaderSegment = {level: string} & Segment;
type BlockQuoteSegment = {level: string, next: string} & Segment;

export interface MarkdownProps {
  children: string
  className?: string
}

interface State {

}
