import Component from "./Component";

export default class Conditional extends Component<ConditionalProps, State> {

  render() {
    return !this.props.condition ? null : this.props.children;
  }

}

export interface ConditionalProps {
  condition?: any
}

interface State {

}
