import { ICredentialType, INodeProperties } from "n8n-workflow";

export class SignalCliApi implements ICredentialType {
  name = "signalCliApi";
  displayName = "Signal CLI API";
  properties: INodeProperties[] = [
    {
      displayName: "URL",
      name: "url",
      type: "string",
      default: process.env.ENDPOINT || "",
      placeholder: "http://localhost:8085",
      required: true,
    },
    {
      displayName: "Account",
      name: "account",
      type: "string",
      default: "",
      required: true,
    },
  ];
}
