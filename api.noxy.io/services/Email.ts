import {SendEmailCommand, SendEmailRequest, SESClient} from "@aws-sdk/client-ses";
import Logger, {LoggerLevels} from "./Logger";

if (!process.env.MAIL_ID) throw new Error("MAIL_ID environmental value must be defined.");
if (!process.env.MAIL_REGION) throw new Error("MAIL_REGION environmental value must be defined.");
if (!process.env.MAIL_SECRET) throw new Error("MAIL_SECRET environmental value must be defined.");

const client = new SESClient({
  region:      process.env.MAIL_REGION,
  credentials: {
    accessKeyId:     process.env.MAIL_ID!,
    secretAccessKey: process.env.MAIL_SECRET!,
  },
});

module Email {

  export async function send(request: SendEmailRequest) {
    try {
      await client.send(new SendEmailCommand(request));
    }
    catch (error) {
      Logger.log({level: LoggerLevels.ERROR, message: error.message, stack: error.stack});
    }
  }

}

export default Email;
