import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Debug from "debug";

const debug = Debug("n8n:signal:utils");

export interface SendMessageParams {
  url: string;
  account: string;
  recipient: string;
  message: string;
}

export async function sendSignalMessage({
  url,
  account,
  recipient,
  message
}: SendMessageParams) {
  // Check if the recipient is a group based on alphabetical characters
  const isTargetAGroup = /[a-zA-Z]/.test(recipient);
  
  const requestBody = {
    jsonrpc: "2.0",
    method: "send",
    params: {
      account,
      message,
      // If value is group send with groupId prefix as required by Signal-cli, 
      // otherwise pass through as phone number via recipient
      [isTargetAGroup ? "groupId" : "recipient"]: recipient,
    },
    id: uuidv4(),
  };
  
  debug("Sending message with requestBody=%o", requestBody);
  
  const response = await axios.post(`${url}/api/v1/rpc`, requestBody);
  
  debug("Response:", response.data);
  
  return response.data;
}