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
});
