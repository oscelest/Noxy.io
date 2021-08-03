import {NextPageContext} from "next";
import Component from "../components/Application/Component";

// noinspection JSUnusedGlobalSymbols
export default class IndexPage extends Component<PageProps, State> {

  public static getInitialProps(context: NextPageContext): PageProps {
    return {permission: null};
  }

  constructor(props: {}) {
    super(props);
  }

  public render() {
    return (
      <div/>
    );
  }
}


interface State {

}
