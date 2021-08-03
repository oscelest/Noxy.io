import React from "react";
import Dialog from "../components/Application/Dialog";

export default class FatalException extends Error {

  public message: string;

  constructor(title: string, message?: string, content?: React.ReactNode) {
    super(message);

    Dialog.show(
      content ?? React.createElement("span", {}, [message]),
      {title},
    );
  }
}
