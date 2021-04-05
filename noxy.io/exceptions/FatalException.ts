import React from "react";
import ElementDialog from "../components/Dialog/ElementDialog";
import Dialog, {DialogListenerType, DialogPriority} from "../components/Application/Dialog";

export default class FatalException extends Error {
  
  public message: string;
  
  constructor(title: string, message?: string) {
    super(title);
    
    this.message = message ?? "This error should only appear if your browser window has been manipulated.\nIf you continue seeing this message, please reload the window.";
    
    Dialog.show(
      DialogListenerType.GLOBAL,
      DialogPriority.FIRST,
      React.createElement(ElementDialog, {title}, [message]),
    );
  }
}
