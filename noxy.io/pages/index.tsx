import {NextPageContext} from "next";
import Component from "../components/Application/Component";
import HTMLText from "../../common/classes/HTMLText";

// noinspection JSUnusedGlobalSymbols
export default class IndexPage extends Component<PageProps, State> {

  public static getInitialProps(context: NextPageContext): PageProps {
    return {permission: null};
  }

  constructor(props: {}) {
    super(props);
    const t = new HTMLText();
    t.insert("Test2");
    t.insert("-Test3");
    t.insert("Test1-", 0);
    t.insert("<b>Test1-<i><b>a</b></i>Test", 0);
    console.log(t.toHTML());
  }

  public render() {
    return (
      <div/>
    );
  }
}


interface State {

}
