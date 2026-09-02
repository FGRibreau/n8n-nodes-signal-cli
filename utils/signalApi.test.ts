import {
  isGroupRecipient,
  resolveSignalReplyTarget,
  SignalEnvelope,
} from "./signalApi";
import fixtures from "./replyTargetFixtures.json";

const OWN_NUMBER = "+33600000000";

// The previous (buggy) group-vs-individual heuristic, kept here only to prove
// the regression: it misrouted UUID-only contacts as groups.
const oldIsTargetAGroup = (recipient: string) => /[a-zA-Z]/.test(recipient);

// The previous (buggy) reply-target cascade from the "Edit Fields" node: on an
// outgoing DM whose destinationNumber is null (UUID-only contact) it skipped to
// envelope.source — the account's own number — sending the reply to Note-to-Self.
const oldResolveReplyTarget = (e: SignalEnvelope): string | undefined =>
  e.syncMessage?.sentMessage?.groupInfo?.groupId ??
  e.dataMessage?.groupInfo?.groupId ??
  e.syncMessage?.sentMessage?.destinationNumber ??
  (e.dataMessage ? e.sourceNumber ?? e.source ?? undefined : e.source ?? undefined);

type Fixture = { envelope: SignalEnvelope; expected: string };
const cases = fixtures as unknown as Record<string, Fixture>;

describe("resolveSignalReplyTarget (real signal-cli envelopes)", () => {
  for (const [name, { envelope, expected }] of Object.entries(cases)) {
    it(`routes ${name} back to ${expected}`, () => {
      expect(resolveSignalReplyTarget(envelope)).toBe(expected);
    });
  }

  // Reported bug, pinned as a permanent counter-example: an outgoing voice note
  // to a UUID-only contact went to the account's own number (Note-to-Self).
  it("no longer sends an outgoing UUID-only DM to Note-to-Self", () => {
    const env = cases.dm_uuid_only_outgoing.envelope;
    // The old cascade demonstrably produced the bug:
    expect(oldResolveReplyTarget(env)).toBe(OWN_NUMBER);
    // The fix routes it to the actual contact:
    expect(resolveSignalReplyTarget(env)).toBe(
      "abcdef01-2345-4678-89ab-cdef01234567"
    );
    expect(resolveSignalReplyTarget(env)).not.toBe(OWN_NUMBER);
  });

  it("never resolves an outgoing (sync) message to the account's own number", () => {
    for (const { envelope } of Object.values(cases)) {
      if (envelope.syncMessage?.sentMessage) {
        expect(resolveSignalReplyTarget(envelope)).not.toBe(OWN_NUMBER);
      }
    }
  });
});

describe("isGroupRecipient", () => {
  const UUID = "abcdef01-2345-4678-89ab-cdef01234567";
  const GROUP = "R0lGdW1teUdyb3VwSWRGb3JQdWJsaWNUZXN0aW5nMDA=";

  it("routes a bare UUID contact as an individual (old heuristic misrouted it)", () => {
    expect(oldIsTargetAGroup(UUID)).toBe(true); // bug: treated as a group
    expect(isGroupRecipient(UUID)).toBe(false); // fix: individual
  });

  it("routes phone numbers as individuals", () => {
    expect(isGroupRecipient(OWN_NUMBER)).toBe(false);
    expect(isGroupRecipient("+33700000000")).toBe(false);
  });

  it("routes base64 group ids as groups", () => {
    expect(isGroupRecipient(GROUP)).toBe(true);
    expect(isGroupRecipient("QW5vdGhlckR1bW15R3JvdXBJZEZvclRlc3RzMDAwMDA=")).toBe(
      true
    );
  });

  // Property: the classification holds across the whole class of each input
  // kind, not just the sampled examples. Deterministic LCG, no Math.random.
  it("holds the classification invariant across generated inputs", () => {
    let seed = 0x2545f491;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    const pick = (chars: string) => chars[Math.floor(rnd() * chars.length)];
    const hex = (n: number) =>
      Array.from({ length: n }, () => pick("0123456789abcdef")).join("");
    const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    for (let i = 0; i < 500; i++) {
      const phone = "+" + (100000000 + Math.floor(rnd() * 900000000));
      expect(isGroupRecipient(phone)).toBe(false);

      const uuid = `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)}`;
      expect(isGroupRecipient(uuid)).toBe(false);

      let group = Array.from({ length: 43 }, () => pick(B64)).join("") + "=";
      if (!/[a-zA-Z]/.test(group)) group = "A" + group.slice(1);
      expect(isGroupRecipient(group)).toBe(true);
    }
  });
});
