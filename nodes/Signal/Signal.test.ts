import { Signal } from "./Signal.node";
import type { IExecuteFunctions } from "n8n-workflow";
import omit from "omit-deep";

jest.mock("uuid", () => ({ v4: () => "n8n" }));

describe("Signal Node", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should send a message", async () => {
    const signal = new Signal();
    const executeFunctions = {
      getCredentials: async () => ({
        url: process.env.ENDPOINT,
        account: process.env.ACCOUNT_NUMBER,
      }),
      getNodeParameter: (paramName: string): string => {
        if (paramName === "account")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "recipient")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "message") return "Hello, world!";
        if (paramName === "resource") return "message";
        if (paramName === "operation") return "send";
        throw new Error(`Unexpected parameter name: ${paramName}`);
      },
      helpers: {},
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as any,
      getExecutionId: jest.fn(),
      getNode: jest.fn(),
      continueOnFail: jest.fn(),
      getInputData: jest.fn(),
      getWorkflowStaticData: jest.fn(),
      getRestApiUrl: jest.fn(),
      getTimezone: jest.fn(),
      getWorkflow: jest.fn(),
    } as unknown as IExecuteFunctions;

    const result = await signal.execute.call(executeFunctions);

    expect(
      omit(result[0][0].json, [
        "timestamp",
        "result.results.0.recipientAddress.uuid",
        "result.results.0.recipientAddress.number",
      ])
    ).toMatchInlineSnapshot(`{}`);
  });

  it("should create a group", async () => {
    const signal = new Signal();
    const executeFunctions = {
      getCredentials: async () => ({
        url: process.env.ENDPOINT,
        account: process.env.ACCOUNT_NUMBER,
      }),
      getNodeParameter: (paramName: string): string => {
        if (paramName === "account")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "name") return "Test Group";
        if (paramName === "members") return `${process.env.ACCOUNT_NUMBER}`;
        if (paramName === "resource") return "group";
        if (paramName === "operation") return "create";
        throw new Error(`Unexpected parameter name: ${paramName}`);
      },
      helpers: {},
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as any,
      getExecutionId: jest.fn(),
      getNode: jest.fn(),
      continueOnFail: jest.fn(),
      getInputData: jest.fn(),
      getWorkflowStaticData: jest.fn(),
      getRestApiUrl: jest.fn(),
      getTimezone: jest.fn(),
      getWorkflow: jest.fn(),
    } as unknown as IExecuteFunctions;

    const result = await signal.execute.call(executeFunctions);

    expect(omit(result[0][0].json, ["timestamp", "result.groupId"]))
      .toMatchInlineSnapshot(`
      {
        "id": "n8n",
        "jsonrpc": "2.0",
        "result": {
          "results": [],
        },
      }
    `);
  });

  it("should list groups", async () => {
    const signal = new Signal();
    const executeFunctions = {
      getCredentials: async () => ({
        url: process.env.ENDPOINT,
        account: process.env.ACCOUNT_NUMBER,
      }),
      getNodeParameter: (paramName: string): string => {
        if (paramName === "account")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "resource") return "group";
        if (paramName === "operation") return "list";
        throw new Error(`Unexpected parameter name: ${paramName}`);
      },
      helpers: {},
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as any,
      getExecutionId: jest.fn(),
      getNode: jest.fn(),
      continueOnFail: jest.fn(),
      getInputData: jest.fn(),
      getWorkflowStaticData: jest.fn(),
      getRestApiUrl: jest.fn(),
      getTimezone: jest.fn(),
      getWorkflow: jest.fn(),
    } as unknown as IExecuteFunctions;

    const result = await signal.execute.call(executeFunctions);

    expect((result?.[0]?.[0]?.json?.result as any[]).length).toBeGreaterThan(0);
    expect(omit(result[0][0].json, ["timestamp", "result"]))
      .toMatchInlineSnapshot(`
      {
        "id": "n8n",
        "jsonrpc": "2.0",
      }
    `);
  });

  it("should list contacts", async () => {
    const signal = new Signal();
    const executeFunctions = {
      getCredentials: async () => ({
        url: process.env.ENDPOINT,
        account: process.env.ACCOUNT_NUMBER,
      }),
      getNodeParameter: (paramName: string): string => {
        if (paramName === "account")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "resource") return "contact";
        if (paramName === "operation") return "list";
        throw new Error(`Unexpected parameter name: ${paramName}`);
      },
      helpers: {},
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as any,
      getExecutionId: jest.fn(),
      getNode: jest.fn(),
      continueOnFail: jest.fn(),
      getInputData: jest.fn(),
      getWorkflowStaticData: jest.fn(),
      getRestApiUrl: jest.fn(),
      getTimezone: jest.fn(),
      getWorkflow: jest.fn(),
    } as unknown as IExecuteFunctions;

    const result = await signal.execute.call(executeFunctions);

    expect((result?.[0]?.[0]?.json?.result as any[]).length).toBeGreaterThan(0);
    expect(omit(result?.[0]?.[0]?.json, ["timestamp", "result"]))
      .toMatchInlineSnapshot(`
      {
        "id": "n8n",
        "jsonrpc": "2.0",
      }
    `);
  });

  // Regression test for #13 / #14: the receipt branch used to send the wrong
  // RPC keys (`timestamp` + `receiptType`), so signal-cli received no
  // target-timestamp list and crashed with a NullPointerException. Sending
  // `target-timestamp: [...]` + `type` must now succeed (no error envelope,
  // which our node turns into a thrown NodeOperationError).
  it("should send a receipt", async () => {
    const signal = new Signal();
    const executeFunctions = {
      getCredentials: async () => ({
        url: process.env.ENDPOINT,
        account: process.env.ACCOUNT_NUMBER,
      }),
      getNodeParameter: (paramName: string): string | number => {
        if (paramName === "account")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "recipient")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "receiptType") return "read";
        if (paramName === "timestamp") return 1700000000000;
        if (paramName === "resource") return "receipt";
        if (paramName === "operation") return "send";
        throw new Error(`Unexpected parameter name: ${paramName}`);
      },
      helpers: {},
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as any,
      getExecutionId: jest.fn(),
      getNode: jest.fn(),
      continueOnFail: jest.fn(),
      getInputData: jest.fn(),
      getWorkflowStaticData: jest.fn(),
      getRestApiUrl: jest.fn(),
      getTimezone: jest.fn(),
      getWorkflow: jest.fn(),
    } as unknown as IExecuteFunctions;

    const result = await signal.execute.call(executeFunctions);

    expect((result[0][0].json as any).error).toBeUndefined();
    expect(omit(result[0][0].json, ["timestamp", "result"]))
      .toMatchInlineSnapshot(`
      {
        "id": "n8n",
        "jsonrpc": "2.0",
      }
    `);
  });

  // Regression test for the reaction branch, which had the same bug class as
  // the receipts (#13/#14): it sent `reaction` + `timestamp` instead of
  // signal-cli's `emoji` + `targetTimestamp`, causing the same NPE.
  it("should send a reaction", async () => {
    const signal = new Signal();
    const executeFunctions = {
      getCredentials: async () => ({
        url: process.env.ENDPOINT,
        account: process.env.ACCOUNT_NUMBER,
      }),
      getNodeParameter: (paramName: string): string | number => {
        if (paramName === "account")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "recipient")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "reaction") return "👍";
        if (paramName === "targetAuthor")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "timestamp") return 1782246010725;
        if (paramName === "resource") return "reaction";
        if (paramName === "operation") return "send";
        throw new Error(`Unexpected parameter name: ${paramName}`);
      },
      helpers: {},
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as any,
      getExecutionId: jest.fn(),
      getNode: jest.fn(),
      continueOnFail: jest.fn(),
      getInputData: jest.fn(),
      getWorkflowStaticData: jest.fn(),
      getRestApiUrl: jest.fn(),
      getTimezone: jest.fn(),
      getWorkflow: jest.fn(),
    } as unknown as IExecuteFunctions;

    const result = await signal.execute.call(executeFunctions);

    expect((result[0][0].json as any).error).toBeUndefined();
    expect(omit(result[0][0].json, ["timestamp", "result"]))
      .toMatchInlineSnapshot(`
      {
        "id": "n8n",
        "jsonrpc": "2.0",
      }
    `);
  });

  it("should remove a reaction", async () => {
    const signal = new Signal();
    const executeFunctions = {
      getCredentials: async () => ({
        url: process.env.ENDPOINT,
        account: process.env.ACCOUNT_NUMBER,
      }),
      getNodeParameter: (paramName: string): string | number => {
        if (paramName === "account")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "recipient")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "reaction") return "👍";
        if (paramName === "targetAuthor")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "timestamp") return 1782246010725;
        if (paramName === "resource") return "reaction";
        if (paramName === "operation") return "remove";
        throw new Error(`Unexpected parameter name: ${paramName}`);
      },
      helpers: {},
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as any,
      getExecutionId: jest.fn(),
      getNode: jest.fn(),
      continueOnFail: jest.fn(),
      getInputData: jest.fn(),
      getWorkflowStaticData: jest.fn(),
      getRestApiUrl: jest.fn(),
      getTimezone: jest.fn(),
      getWorkflow: jest.fn(),
    } as unknown as IExecuteFunctions;

    const result = await signal.execute.call(executeFunctions);

    expect((result[0][0].json as any).error).toBeUndefined();
    expect(omit(result[0][0].json, ["timestamp", "result"]))
      .toMatchInlineSnapshot(`
      {
        "id": "n8n",
        "jsonrpc": "2.0",
      }
    `);
  });

  it("should update a contact", async () => {
    const signal = new Signal();
    const executeFunctions = {
      getCredentials: async () => ({
        url: process.env.ENDPOINT,
        account: process.env.ACCOUNT_NUMBER,
      }),
      getNodeParameter: (paramName: string): string => {
        if (paramName === "account")
          return process.env.ACCOUNT_NUMBER as string;
        if (paramName === "recipient")
          return process.env.ACCOUNT_NUMBER as string;
        // Idempotent: re-applies the account's own existing display name.
        if (paramName === "name") return "François-Guillaume Ribreau";
        if (paramName === "resource") return "contact";
        if (paramName === "operation") return "update";
        throw new Error(`Unexpected parameter name: ${paramName}`);
      },
      helpers: {},
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as any,
      getExecutionId: jest.fn(),
      getNode: jest.fn(),
      continueOnFail: jest.fn(),
      getInputData: jest.fn(),
      getWorkflowStaticData: jest.fn(),
      getRestApiUrl: jest.fn(),
      getTimezone: jest.fn(),
      getWorkflow: jest.fn(),
    } as unknown as IExecuteFunctions;

    const result = await signal.execute.call(executeFunctions);

    expect((result[0][0].json as any).error).toBeUndefined();
    expect((result[0][0].json as any).jsonrpc).toBe("2.0");
  });

  // #16: signal-cli's getAttachment is exercised for real. An unknown id must
  // be surfaced as a NodeOperationError, NOT returned as a fake-successful
  // empty item (which is what the previous error handling would have done).
  it("should surface a getAttachment error for an unknown id", async () => {
    const account = process.env.ACCOUNT_NUMBER as string;
    const signal = new Signal();
    const executeFunctions = {
      getCredentials: async () => ({ url: process.env.ENDPOINT, account }),
      getNodeParameter: (paramName: string): string => {
        if (paramName === "resource") return "attachment";
        if (paramName === "operation") return "get";
        if (paramName === "account") return account;
        if (paramName === "attachmentId") return `unknown-${process.pid}`;
        if (paramName === "recipient") return "";
        if (paramName === "groupId") return "";
        if (paramName === "binaryPropertyName") return "data";
        throw new Error(`Unexpected parameter name: ${paramName}`);
      },
      helpers: {
        // Minimal real binary helper; the signal-cli call itself is real.
        prepareBinaryData: async (buffer: Buffer, fileName?: string) => ({
          data: buffer.toString("base64"),
          fileName,
          mimeType: "application/octet-stream",
        }),
      },
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as any,
      getExecutionId: jest.fn(),
      getNode: jest.fn(),
      continueOnFail: jest.fn(),
      getInputData: jest.fn(),
      getWorkflowStaticData: jest.fn(),
      getRestApiUrl: jest.fn(),
      getTimezone: jest.fn(),
      getWorkflow: jest.fn(),
    } as unknown as IExecuteFunctions;

    await expect(signal.execute.call(executeFunctions)).rejects.toThrow(
      /getAttachment failed/
    );
  });
});
