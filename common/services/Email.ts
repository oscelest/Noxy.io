import {SendEmailCommand, SendEmailRequest, SESClient} from "@aws-sdk/client-ses";
import Logger from "./Logger";
import Level = Logger.Level;

const default_region = "n/a";
const default_access_key = "";
const default_secret_key = "";

let is_stubbed = !process.env.MAIL_ID || !process.env.MAIL_REGION || !process.env.MAIL_SECRET;
if (!process.env.MAIL_ID) Logger.write(Level.INFO, "MAIL_ID environmental value is not defined. Email will be stubbed.");
if (!process.env.MAIL_REGION) Logger.write(Level.INFO, "MAIL_REGION environmental value is not defined. Email will be stubbed.");
if (!process.env.MAIL_SECRET) Logger.write(Level.INFO, "MAIL_SECRET environmental value is not defined. Email will be stubbed.");

module Email {

  let region: string = !is_stubbed ? process.env.MAIL_REGION! : default_region;
  let access_key: string = !is_stubbed ? process.env.MAIL_ID! : default_access_key;
  let secret_key: string = !is_stubbed ? process.env.MAIL_SECRET! : default_secret_key;

  export const client = new SESClient({
    region:      region,
    credentials: {
      accessKeyId:     access_key,
      secretAccessKey: secret_key,
    },
  });

  export async function send(request: SendEmailRequest) {
    try {
      if (await client.config.region() === default_region) return console.log(request);
      await client.send(new SendEmailCommand(request));
    }
    catch (error) {
      Logger.write(Logger.Level.ERROR, error);
    }
  }
}

console.log(Email.client);
console.log(Email.client.config.region());

export default Email;
