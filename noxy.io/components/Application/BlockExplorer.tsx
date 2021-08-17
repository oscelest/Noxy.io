import Component from "./Component";
import Style from "../Block/TextBlock.module.scss";
import {TextBlockProps} from "../Block/TextBlock";

export default class BlockExplorer extends Component<BlockExplorerProps, State> {

  constructor(props: TextBlockProps) {
    super(props);
  }

  public render() {
    const readonly = this.props.readonly ?? true;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        {readonly ? "Yes" : "No"}
      </div>
    );
  }
}

export interface BlockExplorerProps {
  readonly?: boolean;
  className?: string;
}

interface State {

}
