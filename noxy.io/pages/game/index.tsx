import Link from "next/link";
import React from "react";
import Button from "../../components/Form/Button";
import Global from "../../Global";

export default class IndexPage extends React.Component<{}, State> {
  
  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;
  
  constructor(props: {}) {
    super(props);
    this.state = {};
  }
  
  public render() {
    return (
      <div style={{flexFlow: "column", padding: "10px"}}>
        <Link href={"/game/battle"}>
          <Button>Battle</Button>
        </Link>
      </div>
    );
  }
}

interface State {

}
