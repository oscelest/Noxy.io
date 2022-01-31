import React from "react";
import IconType from "../../../enums/IconType";
import Component from "../Component";
import Style from "./BlockEditorToolbarAlignment.module.scss";
import Alignment from "../../../../common/enums/Alignment";
import Switch, {SwitchCollection} from "../../Form/Switch";

export default class BlockEditorToolbarAlignment extends Component<BlockEditorToolbarAlignmentProps, State> {

  private static switch_alignment_collection: SwitchCollection<Alignment> = [
    {value: Alignment.LEFT, icon: IconType.ALIGN_LEFT},
    {value: Alignment.CENTER, icon: IconType.ALIGN_CENTER},
    {value: Alignment.RIGHT, icon: IconType.ALIGN_RIGHT},
  ];

  constructor(props: BlockEditorToolbarAlignmentProps) {
    super(props);
    this.state = {
      dropdown_color:            false,
      dropdown_background_color: false,
    };
  }

  public render() {
    const {className, disabled, alignment = Alignment.LEFT} = this.props;

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <Switch className={classes.join(" ")} value={alignment} list={BlockEditorToolbarAlignment.switch_alignment_collection} disabled={disabled} onChange={this.eventAlignmentChange}/>
    );
  }

  private readonly eventAlignmentChange = (alignment: Alignment) => {
    this.props.onChange(alignment);
  };
}

export interface BlockEditorToolbarAlignmentProps {
  className?: string;
  disabled?: boolean;

  alignment?: Alignment;

  onChange(alignment: Alignment): void;
}

interface State {
  dropdown_color: boolean;
  dropdown_background_color: boolean;
}
