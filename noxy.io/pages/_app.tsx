import App from "next/app";
import Head from "next/head";
import router, {Router} from "next/router";
import * as React from "react";
import PermissionLevel from "../../common/enums/PermissionLevel";
import Authorized from "../components/Application/Authorized";
import Dialog from "../components/Application/Dialog";
import Redirect from "../components/UI/Redirect";
import DialogListenerName from "../enums/DialogListenerName";
import Size from "../enums/Size";
import Global from "../Global";
import "../global.scss";
import Style from "./_app.module.scss";

// noinspection JSUnusedGlobalSymbols
export default class Application extends App {

  public render() {
    return (
      <Global.Provider>
        <Head>
          <title>Noxy.io</title>
          <meta charSet="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <meta httpEquiv="X-UA-Compatible" content="ie=edge"/>

          <meta property="og:title" content="Noxy.io"/>
          <meta property="og:description" content="Something coming soon™"/>
          <meta property="og:type" content="website"/>
          <meta property="og:url" content="https://noxy.io/"/>
          <meta property="og:image" content="https://noxy.io/static/preview.png"/>

          <meta name="viewport" content="initial-scale=1.0, width=device-width"/>
          <link rel="shortcut icon" type="image/x-icon" href="/static/favicon.ico"/>
          <style>
            {
              "@font-face {font-family: IcoFont; src: url(/static/fonts/IcoFont.woff2); font-weight: 400;}\n" +
              // "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-LightItalic.ttf); font-style: italic; font-weight: 300;}\n" +
              // "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-ExtraLight.ttf); font-weight: 200;}\n" +
              // "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-ExtraLightItalic.ttf); font-style: italic; font-weight: 200;}\n" +
              // "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-Light.ttf); font-weight: 300;}\n" +
              "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-Regular.ttf); font-weight: 400;}\n" +
              "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-RegularItalic.ttf); font-style: italic; font-weight: 400;}\n" +
              // "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-SemiBold.ttf); font-weight: 600;}\n" +
              // "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-SemiBoldItalic.ttf); font-style: italic; font-weight: 600;}\n" +
              "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-Bold.ttf); font-weight: 700;}\n" +
              // "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-BoldItalic.ttf); font-style: italic; font-weight: 700;}\n" +
              // "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-ExtraBold.ttf); font-weight: 800;}\n" +
              // "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-ExtraBoldItalic.ttf); font-style: italic; font-weight: 800;}\n" +
              // "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-Black.ttf); font-weight: 900;}\n" +
              // "@font-face {font-family: Nunito; src: url(/static/fonts/NunitoSans-BlackItalic.ttf); font-style: italic; font-weight: 900;}\n" +
              ""
            }
          </style>
        </Head>
        <Header/>
        <Content>
          <this.props.Component {...this.props.pageProps}/>
        </Content>
        <Dialog key={"dialog"} listener={DialogListenerName.GLOBAL}/>
      </Global.Provider>
    );
  }
}

class Header extends React.Component {

  public static contextType = Global.Context;
  public context: Global.Context;

  public render() {
    return (
      <div className={Style.Header}>
        <Redirect className={Style.Link} href={"/"}>
          <span className={Style.Logo}>Noxy</span>
        </Redirect>
        <div className={Style.Navigation}>
          <Authorized size={Size.SMALL} permission={null}>
            <Authorized>
              <Redirect className={Style.Link} href={"/file"}>Files</Redirect>
            </Authorized>
            <Redirect className={Style.Link} href={"/account"}>
              {this.context.state.user ? "Account" : "Log In / Sign Up"}
            </Redirect>
          </Authorized>
        </div>
      </div>
    );
  }
}

class Content extends React.Component<{}, {permission?: PermissionLevel | null}> {

  public static contextType = Global.Context;
  public context: Global.Context;

  constructor(props: {}) {
    super(props);
    this.state = {permission: null};
  }

  private readonly getPermission = () => {
    return (router as unknown as Router)?.components?.[router.route]?.props?.pageProps?.permission;
  };

  public componentDidMount(): void {
    this.setState({permission: this.getPermission()});
  }

  public componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{permission?: PermissionLevel | null}>, snapshot?: any): void {
    const permission = this.getPermission();
    if (permission !== this.state.permission) {
      this.setState({permission});
    }
  }

  public render() {
    return (
      <div className={Style.Content}>
        <Authorized permission={this.state.permission} form={true}>
          <div className={Style.Page}>{this.props.children}</div>
        </Authorized>
      </div>
    );
  }

}
