import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from "n8n-workflow";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Debug from "debug";
import { sendSignalMessage } from "../../utils/signalApi";

const debug = Debug("n8n:signal");

export class Signal implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Signal",
    name: "signal",
    group: ["output"],
    version: 1,
    description: "Interact with Signal CLI API",
    defaults: {
      name: "Signal",
    },
    // @ts-ignore
    inputs: ["main"],
    // @ts-ignore
    outputs: ["main"],
    credentials: [
      {
        name: "signalCliApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "Attachment",
            value: "attachment",
          },
          {
            name: "Contact",
            value: "contact",
          },
          {
            name: "Group",
            value: "group",
          },
          {
            name: "Message",
            value: "message",
          },
          {
            name: "Reaction",
            value: "reaction",
          },
          {
            name: "Receipt",
            value: "receipt",
          },
        ],
        default: "message",
      },
      // Message properties
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["message"],
          },
        },
        options: [
          {
            name: "Send",
            value: "send",
            action: "Send a message",
          },
        ],
        default: "send",
      },
      {
        displayName: "Account",
        name: "account",
        type: "string",
        description: "Phone number (international format)",
        default: "",
        required: true,
        displayOptions: {
          show: {
            resource: ["message"],
          },
        },
      },
      {
        displayName: "Recipient",
        name: "recipient",
        type: "string",
        default: "",
        required: true,
        description:
          "Phone number (international format) or group ID of the recipient",
        displayOptions: {
          show: {
            resource: ["message"],
            operation: ["send"],
          },
        },
      },
      {
        displayName: "Message",
        name: "message",
        type: "string",
        default: "",
        required: true,
        description: "The message to be sent",
        displayOptions: {
          show: {
            resource: ["message"],
            operation: ["send"],
          },
        },
      },
      // Group properties
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["group"],
          },
        },
        options: [
          {
            name: "Create",
            value: "create",
            action: "Create a group",
          },
          {
            name: "List",
            value: "list",
            action: "List a group",
          },
        ],
        default: "create",
      },
      {
        displayName: "Account",
        name: "account",
        type: "string",
        default: "",
        required: true,
        displayOptions: {
          show: {
            resource: ["group"],
          },
        },
      },
      {
        displayName: "Name",
        name: "name",
        type: "string",
        default: "",
        required: true,
        description: "The name of the group",
        displayOptions: {
          show: {
            resource: ["group"],
            operation: ["create"],
          },
        },
      },
      {
        displayName: "Members",
        name: "members",
        type: "string",
        default: "",
        required: true,
        description: "Comma-separated list of members to add to the group",
        displayOptions: {
          show: {
            resource: ["group"],
            operation: ["create"],
          },
        },
      },
      // Contact properties
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["contact"],
          },
        },
        options: [
          {
            name: "Update",
            value: "update",
            action: "Update a contact",
          },
          {
            name: "List",
            value: "list",
            action: "List a contact",
          },
        ],
        default: "update",
      },
      {
        displayName: "Account",
        name: "account",
        type: "string",
        default: "",
        required: true,
        displayOptions: {
          show: {
            resource: ["contact"],
          },
        },
      },
      {
        displayName: "Recipient",
        name: "recipient",
        type: "string",
        default: "",
        required: true,
        description: "Phone number of the contact",
        displayOptions: {
          show: {
            resource: ["contact"],
            operation: ["update"],
          },
        },
      },
      {
        displayName: "Name",
        name: "name",
        type: "string",
        default: "",
        description: "The name of the contact",
        displayOptions: {
          show: {
            resource: ["contact"],
            operation: ["update"],
          },
        },
      },
      // Reaction properties
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["reaction"],
          },
        },
        options: [
          {
            name: "Send",
            value: "send",
            action: "Send a reaction",
          },
          {
            name: "Remove",
            value: "remove",
            action: "Remove a reaction",
          },
        ],
        default: "send",
      },
      {
        displayName: "Account",
        name: "account",
        type: "string",
        default: "",
        required: true,
        displayOptions: {
          show: {
            resource: ["reaction"],
          },
        },
      },
      {
        displayName: "Recipient",
        name: "recipient",
        type: "string",
        default: "",
        required: true,
        description: "Phone number or group ID of the recipient",
        displayOptions: {
          show: {
            resource: ["reaction"],
            operation: ["send", "remove"],
          },
        },
      },
      {
        displayName: "Reaction",
        name: "reaction",
        type: "string",
        default: "",
        required: true,
        description: "The reaction to be sent",
        displayOptions: {
          show: {
            resource: ["reaction"],
            operation: ["send", "remove"],
          },
        },
      },
      {
        displayName: "Target Author",
        name: "targetAuthor",
        type: "string",
        default: "",
        required: true,
        description: "The author of the message being reacted to",
        displayOptions: {
          show: {
            resource: ["reaction"],
            operation: ["send", "remove"],
          },
        },
      },
      {
        displayName: "Timestamp",
        name: "timestamp",
        type: "number",
        default: 0,
        required: true,
        description: "The timestamp of the message being reacted to",
        displayOptions: {
          show: {
            resource: ["reaction"],
            operation: ["send", "remove"],
          },
        },
      },
      // Receipt properties
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["receipt"],
          },
        },
        options: [
          {
            name: "Send",
            value: "send",
            action: "Send a receipt",
          },
        ],
        default: "send",
      },
      {
        displayName: "Account",
        name: "account",
        type: "string",
        default: "",
        required: true,
        displayOptions: {
          show: {
            resource: ["receipt"],
          },
        },
      },
      {
        displayName: "Recipient",
        name: "recipient",
        type: "string",
        default: "",
        required: true,
        description: "Phone number or group ID of the recipient",
        displayOptions: {
          show: {
            resource: ["receipt"],
            operation: ["send"],
          },
        },
      },
      {
        displayName: "Receipt Type",
        name: "receiptType",
        type: "options",
        options: [
          {
            name: "Read",
            value: "read",
          },
          {
            name: "Viewed",
            value: "viewed",
          },
        ],
        default: "read",
        required: true,
        displayOptions: {
          show: {
            resource: ["receipt"],
            operation: ["send"],
          },
        },
      },
      {
        displayName: "Timestamp",
        name: "timestamp",
        type: "number",
        default: 0,
        required: true,
        description: "The timestamp of the message being receipted",
        displayOptions: {
          show: {
            resource: ["receipt"],
            operation: ["send"],
          },
        },
      },
      // Attachment properties
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["attachment"],
          },
        },
        options: [
          {
            name: "Get",
            value: "get",
            action: "Get an attachment",
          },
        ],
        default: "get",
      },
      {
        displayName: "Account",
        name: "account",
        type: "string",
        description: "Phone number (international format)",
        default: "",
        required: true,
        displayOptions: {
          show: {
            resource: ["attachment"],
          },
        },
      },
      {
        displayName: "Attachment ID",
        name: "attachmentId",
        type: "string",
        default: "",
        required: true,
        description:
          "The attachment ID, taken from a received message's attachments list",
        displayOptions: {
          show: {
            resource: ["attachment"],
            operation: ["get"],
          },
        },
      },
      {
        displayName: "Recipient",
        name: "recipient",
        type: "string",
        default: "",
        description:
          "Phone number the attachment was sent from. Set this or Group ID.",
        displayOptions: {
          show: {
            resource: ["attachment"],
            operation: ["get"],
          },
        },
      },
      {
        displayName: "Group ID",
        name: "groupId",
        type: "string",
        default: "",
        description:
          "Group ID the attachment was sent in. Set this or Recipient.",
        displayOptions: {
          show: {
            resource: ["attachment"],
            operation: ["get"],
          },
        },
      },
      {
        displayName: "Put Output In Field",
        name: "binaryPropertyName",
        type: "string",
        default: "data",
        required: true,
        description:
          "The name of the output binary field to put the downloaded file in",
        displayOptions: {
          show: {
            resource: ["attachment"],
            operation: ["get"],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const resource = this.getNodeParameter("resource", 0) as string;
    const operation = this.getNodeParameter("operation", 0) as string;
    const credentials = await this.getCredentials("signalCliApi");

    if (!credentials.url) {
      throw new NodeOperationError(
        this.getNode(),
        "Signal CLI API URL is not set in credentials"
      );
    }

    const url = `${credentials.url}/api/v1/rpc`;

    try {
      let response;
      debug(
        "Signal Node: Executing with resource=%s, operation=%s",
        resource,
        operation
      );
      if (resource === "message" && operation === "send") {
        const account = this.getNodeParameter("account", 0) as string;
        const recipient = this.getNodeParameter("recipient", 0) as string;
        const message = this.getNodeParameter("message", 0) as string;

        response = await sendSignalMessage({
          url: credentials.url as string,
          account,
          recipient,
          message
        });
      } else if (resource === "group" && operation === "create") {
        const account = this.getNodeParameter("account", 0) as string;
        const name = this.getNodeParameter("name", 0) as string;
        const members = (this.getNodeParameter("members", 0) as string).split(
          ","
        );

        const requestBody = {
          jsonrpc: "2.0",
          method: "updateGroup",
          params: {
            account,
            name,
            members,
          },
          id: uuidv4(),
        };
        debug("Signal Node: Creating group with requestBody=%o", requestBody);
        response = await axios.post(`${url}`, requestBody);
      } else if (resource === "group" && operation === "list") {
        const account = this.getNodeParameter("account", 0) as string;

        const requestBody = {
          jsonrpc: "2.0",
          method: "listGroups",
          params: { account },
          id: uuidv4(),
        };

        response = await axios.post(`${url}`, requestBody);
      } else if (resource === "contact" && operation === "update") {
        const account = this.getNodeParameter("account", 0) as string;
        const recipient = this.getNodeParameter("recipient", 0) as string;
        const name = this.getNodeParameter("name", 0) as string;

        const requestBody = {
          jsonrpc: "2.0",
          method: "updateContact",
          params: { account, recipient, name },
          id: uuidv4(),
        };

        response = await axios.post(`${url}`, requestBody);
      } else if (resource === "contact" && operation === "list") {
        const account = this.getNodeParameter("account", 0) as string;

        const requestBody = {
          jsonrpc: "2.0",
          method: "listContacts",
          params: { account },
          id: uuidv4(),
        };

        response = await axios.post(`${url}`, requestBody);
      } else if (resource === "reaction" && operation === "send") {
        const account = this.getNodeParameter("account", 0) as string;
        const recipient = this.getNodeParameter("recipient", 0) as string;
        const reaction = this.getNodeParameter("reaction", 0) as string;
        const targetAuthor = this.getNodeParameter("targetAuthor", 0) as string;
        const timestamp = this.getNodeParameter("timestamp", 0) as number;

        const requestBody = {
          jsonrpc: "2.0",
          method: "sendReaction",
          params: {
            account,
            recipient,
            emoji: reaction,
            targetAuthor,
            targetTimestamp: timestamp,
          },
          id: uuidv4(),
        };

        response = await axios.post(`${url}`, requestBody);
      } else if (resource === "reaction" && operation === "remove") {
        const account = this.getNodeParameter("account", 0) as string;
        const recipient = this.getNodeParameter("recipient", 0) as string;
        const reaction = this.getNodeParameter("reaction", 0) as string;
        const targetAuthor = this.getNodeParameter("targetAuthor", 0) as string;
        const timestamp = this.getNodeParameter("timestamp", 0) as number;

        const requestBody = {
          jsonrpc: "2.0",
          method: "sendReaction",
          params: {
            account,
            recipient,
            emoji: reaction,
            targetAuthor,
            targetTimestamp: timestamp,
            remove: true,
          },
          id: uuidv4(),
        };

        response = await axios.post(`${url}`, requestBody);
      } else if (resource === "receipt" && operation === "send") {
        const account = this.getNodeParameter("account", 0) as string;
        const recipient = this.getNodeParameter("recipient", 0) as string;
        const receiptType = this.getNodeParameter("receiptType", 0) as string;
        const timestamp = this.getNodeParameter("timestamp", 0) as number;

        const requestBody = {
          jsonrpc: "2.0",
          method: "sendReceipt",
          params: {
            account,
            recipient,
            type: receiptType,
            "target-timestamp": [timestamp],
          },
          id: uuidv4(),
        };

        response = await axios.post(`${url}`, requestBody);
      } else if (resource === "attachment" && operation === "get") {
        const account = this.getNodeParameter("account", 0) as string;
        const id = this.getNodeParameter("attachmentId", 0) as string;
        const recipient = this.getNodeParameter("recipient", 0) as string;
        const groupId = this.getNodeParameter("groupId", 0) as string;
        const binaryPropertyName = this.getNodeParameter(
          "binaryPropertyName",
          0
        ) as string;

        const params: Record<string, unknown> = { account, id };
        if (recipient) {
          params.recipient = recipient;
        }
        if (groupId) {
          params.groupId = groupId;
        }

        const requestBody = {
          jsonrpc: "2.0",
          method: "getAttachment",
          params,
          id: uuidv4(),
        };

        debug("Signal Node: Getting attachment with requestBody=%o", requestBody);
        const attachmentResponse = await axios.post(`${url}`, requestBody);
        const rpc = attachmentResponse.data;

        if (rpc && rpc.error) {
          throw new NodeOperationError(
            this.getNode(),
            `signal-cli getAttachment failed for id ${id}: ${rpc.error.message}`
          );
        }

        // signal-cli returns the data as a base64 string, either directly as
        // `result` or nested under `result.data` depending on the build.
        const result = rpc.result;
        const base64 =
          typeof result === "string" ? result : result && result.data;
        if (!base64) {
          throw new NodeOperationError(
            this.getNode(),
            `signal-cli getAttachment returned an empty payload for id ${id}`
          );
        }

        const buffer = Buffer.from(base64, "base64");
        const binaryData = await this.helpers.prepareBinaryData(buffer, id);
        const item: INodeExecutionData = {
          json: { account, id, recipient, groupId },
          binary: { [binaryPropertyName]: binaryData },
        };
        return [[item]];
      }

      debug("Signal Node: Response", response?.data);
      if (response && response.data && response.data.error) {
        throw new NodeOperationError(
          this.getNode(),
          `signal-cli ${resource} ${operation} failed: ${response.data.error.message}`
        );
      }
      const item: INodeExecutionData = {
        json: response?.data,
      };
      return [[item]];
    } catch (error) {
      // Preserve specific, already-actionable errors (e.g. JSON-RPC failures
      // surfaced above) instead of masking them with a generic message.
      if (error instanceof NodeOperationError) {
        throw error;
      }
      throw new NodeOperationError(
        this.getNode(),
        "Error interacting with Signal API",
        {
          itemIndex: 0,
        }
      );
    }
  }
}
