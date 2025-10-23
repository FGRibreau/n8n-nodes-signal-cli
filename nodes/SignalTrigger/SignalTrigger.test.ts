import { sendSignalMessage } from "../../utils/signalApi";
import { SignalTrigger } from "./SignalTrigger.node";
import { ITriggerFunctions, IDataObject, INode, INodeExecutionData, ICredentialDataDecryptedObject } from "n8n-workflow";
import { EventEmitter } from "events";

describe("SignalTrigger Integration Test with real Signal CLI", () => {
  const SIGNAL_CLI_URL = process.env.ENDPOINT!;
  const ACCOUNT_NUMBER = process.env.ACCOUNT_NUMBER!;
  
  // Skip tests if ACCOUNT_NUMBER is not set
  if (!process.env.ACCOUNT_NUMBER) {
    throw new Error("ACCOUNT_NUMBER environment variable is required. Set it to your Signal phone number (e.g., +33612345678)");
  }

  // Skip tests if ENDPOINT is not set
  if (!process.env.ENDPOINT) {
    throw new Error("ENDPOINT environment variable is required. Set it to your Signal-cli REST API endpoint(e.g., http://127.0.0.1:8085)");
  }

  // Helper to create mock ITriggerFunctions
  interface MockTriggerFunctions extends ITriggerFunctions {
    eventEmitter: EventEmitter;
    receivedData: INodeExecutionData[][];
  }

  function createMockTriggerFunctions(): MockTriggerFunctions {
    const eventEmitter = new EventEmitter();
    const receivedData: INodeExecutionData[][] = [];

    // Create a mock node
    const mockNode: INode = {
      id: 'test-node-id',
      name: 'Signal Trigger',
      type: 'signalTrigger',
      typeVersion: 1,
      position: [0, 0],
      parameters: {},
    };

    const mockTriggerFunctions: ITriggerFunctions = {
      emit: (data: INodeExecutionData[][]) => {
        receivedData.push(...data);
        eventEmitter.emit('data', data);
      },
      getCredentials: async (name: string) => {
        if (name === "signalCliApi") {
          return {
            url: SIGNAL_CLI_URL,
          } as ICredentialDataDecryptedObject;
        }
        throw new Error(`Unknown credential: ${name}`);
      },
      getNode: () => mockNode,
      getNodeParameter: (parameterName: string, itemIndex?: number, fallbackValue?: any) => {
        return fallbackValue;
      },
      logger: {
        info: console.log,
        error: console.error,
        debug: console.log,
        warn: console.warn,
        verbose: console.log,
      },
      helpers: {
        returnJsonArray: (data: IDataObject[]) => {
          return data.map(item => ({
            json: item,
            pairedItem: { item: 0 },
          }));
        },
      },
    } as unknown as ITriggerFunctions;

    return Object.assign(mockTriggerFunctions, {
      eventEmitter,
      receivedData,
    }) as MockTriggerFunctions;
  }
  
  // note: this test must connect to another signal-cli when sending the message in http mode to work
  it.skip("should connect to Signal CLI and receive messages using SignalTrigger node", async () => {
    // Create the SignalTrigger node instance
    const signalTrigger = new SignalTrigger();
    const mockFunctions = createMockTriggerFunctions();
    
    // Start the trigger
    const triggerResponse = await signalTrigger.trigger.call(mockFunctions);
    expect(triggerResponse).toHaveProperty('closeFunction');
    
    // Wait for connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send a test message
    const testMessage = `Test message from SignalTrigger test - ${new Date().toISOString()}`;
    console.log(`Sending test message from ${ACCOUNT_NUMBER} to ${ACCOUNT_NUMBER}...`);
    
    // Set up promise to wait for the message
    const messageReceived = new Promise<INodeExecutionData[][]>((resolve) => {
      mockFunctions.eventEmitter.on('data', (data: INodeExecutionData[][]) => {
        console.log("SignalTrigger emitted data:", JSON.stringify(data, null, 2));
        resolve(data);
      });
    });
    
    await sendSignalMessage({
      url: SIGNAL_CLI_URL,
      account: ACCOUNT_NUMBER,
      recipient: ACCOUNT_NUMBER,
      message: testMessage
    });
    console.log("Test message sent successfully");
    
    // Wait for the message to be received (with timeout)
    const receivedData = await Promise.race([
      messageReceived,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000))
    ]);
    
    // Close the trigger
    if (triggerResponse.closeFunction) {
      await triggerResponse.closeFunction();
    }
    
    // Verify that we received the message
    expect(receivedData).not.toBeNull();
    expect(receivedData).toBeDefined();
    
    if (receivedData) {
      expect(receivedData.length).toBeGreaterThan(0);
      expect(receivedData[0].length).toBeGreaterThan(0);
      
      const messageData = receivedData[0][0].json;
      console.log("Received message data:", messageData);
      
      // Check if it's our test message
      if ((messageData.dataMessage as any)?.message?.includes("Test message from SignalTrigger test")) {
        expect((messageData.dataMessage as any).message).toContain("Test message from SignalTrigger test");
        console.log("✓ Test message was successfully received by the SignalTrigger node!");
      }
    }
    
    // Check all received data
    const allReceivedData = mockFunctions.receivedData;
    console.log(`Total events received by SignalTrigger: ${allReceivedData.length}`);
  }, 30000);
});