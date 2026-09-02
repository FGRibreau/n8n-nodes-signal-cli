import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Debug from "debug";

const debug = Debug("n8n:signal:utils");

// An E.164 phone number, e.g. "+15550001234".
const PHONE_RE = /^\+\d+$/;
// A bare account UUID (ACI), e.g. "00000000-0000-4000-8000-000000000000".
// signal-cli hands these out for contacts that never shared a phone number.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Decide whether a Signal recipient identifier is a group or an individual.
 *
 * signal-cli's `send` takes the target under `groupId` for groups and
 * `recipient` for individuals. Phone numbers and bare account UUIDs are
 * individuals; a base64 group id (which also carries letters, but is neither a
 * phone number nor a UUID) is a group. The previous "has any letter → group"
 * heuristic misclassified UUID-only contacts as groups.
 */
export function isGroupRecipient(recipient: string): boolean {
  if (PHONE_RE.test(recipient)) return false;
  if (UUID_RE.test(recipient)) return false;
  return /[a-zA-Z]/.test(recipient);
}

// Subset of the signal-cli envelope we need to route a reply.
export interface SignalEnvelope {
  source?: string | null;
  sourceNumber?: string | null;
  sourceUuid?: string | null;
  dataMessage?: {
    groupInfo?: { groupId?: string | null } | null;
  } | null;
  syncMessage?: {
    sentMessage?: {
      groupInfo?: { groupId?: string | null } | null;
      destinationNumber?: string | null;
      destinationUuid?: string | null;
    } | null;
  } | null;
}

/**
 * Resolve where a reply (e.g. a transcript) must be delivered so it lands back
 * in the conversation the message came from.
 *
 *  - group message      → the group id
 *  - outgoing DM (sync) → the destination: its number, else its bare UUID for
 *                         UUID-only contacts. NEVER `envelope.source`, which on
 *                         a sync message is the account's own number (that
 *                         fallback is what sent transcripts to Note-to-Self).
 *  - incoming DM        → the sender: number, else UUID, else source.
 *
 * This mirrors the `groupId` expression of the "Edit Fields" node in the
 * "Signal- auto-transcribe" n8n workflow; keep the two in sync.
 */
export function resolveSignalReplyTarget(
  envelope: SignalEnvelope
): string | undefined {
  const sent = envelope.syncMessage?.sentMessage;
  if (sent) {
    return (
      sent.groupInfo?.groupId ??
      sent.destinationNumber ??
      sent.destinationUuid ??
      undefined
    );
  }
  const data = envelope.dataMessage;
  if (data) {
    return (
      data.groupInfo?.groupId ??
      envelope.sourceNumber ??
      envelope.sourceUuid ??
      envelope.source ??
      undefined
    );
  }
  return envelope.source ?? undefined;
}

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
  const isTargetAGroup = isGroupRecipient(recipient);

  const requestBody = {
    jsonrpc: "2.0",
    method: "send",
    params: {
      account,
      message,
      // If value is a group send with groupId as required by signal-cli,
      // otherwise pass through as an individual recipient (phone number or UUID)
      [isTargetAGroup ? "groupId" : "recipient"]: recipient,
    },
    id: uuidv4(),
  };

  debug("Sending message with requestBody=%o", requestBody);

  const response = await axios.post(`${url}/api/v1/rpc`, requestBody);

  debug("Response:", response.data);

  return response.data;
}
