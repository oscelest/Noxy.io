import React from "react";

export default class Conditional extends React.Component<ConditionalProps, State> {

  render() {
    return !this.props.condition ? null : this.props.children;
  }

}

export interface ConditionalProps {
  condition?: any
}

interface State {

}
