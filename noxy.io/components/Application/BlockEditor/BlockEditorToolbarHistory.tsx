import React from "react";
import IconType from "../../../enums/IconType";
import Component from "../Component";
import Style from "./BlockEditorToolbarAlignment.module.scss";
import Alignment from "../../../../common/enums/Alignment";
import Button from "../../Form/Button";

export default class BlockEditorToolbarAlignment extends Component<BlockEditorToolbarAlignmentProps, State> {

  constructor(props: BlockEditorToolbarAlignmentProps) {
    super(props);
    this.state = {
      dropdown_color:            false,
      dropdown_background_color: false,
    };
  }

  public render() {
    const {className, disabled} = this.props;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <div>
        <Button icon={IconType.REDO} disabled={disabled}/>
        <Button icon={IconType.UNDO} disabled={disabled}/>
      </div>
    );
  }
}

export interface BlockEditorToolbarAlignmentProps {
  className?: string;
  disabled?: boolean;

  onChange(alignment: Alignment): void;
}

interface State {

}
