import {
  ITriggerFunctions,
  IDataObject,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
  ITriggerResponse,
  jsonParse,
} from "n8n-workflow";
import { EventSource } from "eventsource";
import debug from "debug";

const signalTriggerDebug = debug("n8n:nodes:signal-trigger");

export class SignalTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Signal Trigger",
    name: "signalTrigger",
    icon: "fa:comment",
    iconColor: "blue",
    group: ["trigger"],
    version: 1,
    description: "Triggers when a new Signal message is received",
    eventTriggerDescription: '',
    activationMessage: 'Waiting for Signal messages...',
    defaults: {
      name: "Signal Trigger",
      color: "#1c75bc",
    },
    triggerPanel: {
      header: '',
      executionsHelp: {
        inactive:
          "<b>While building your workflow</b>, click the 'execute step' button, then send a Signal message. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Once you're happy with your workflow</b>, <a data-key='activate'>activate</a> it. Then every time a Signal message is received, the workflow will execute. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
        active:
          "<b>While building your workflow</b>, click the 'execute step' button, then send a Signal message. This will trigger an execution, which will show up in this editor.<br /> <br /><b>Your workflow will also execute automatically</b>, since it's activated. Every time a Signal message is received, this node will trigger an execution. These executions will show up in the <a data-key='executions'>executions list</a>, but not in the editor.",
      },
      activationHint:
        "Once you've finished building your workflow, <a data-key='activate'>activate</a> it to have it also listen continuously for Signal messages.",
    },
    inputs: [],
    // @ts-ignore
    outputs: ["main"],
    credentials: [
      {
        name: "signalCliApi",
        required: true,
      },
    ],
    properties: [],
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const credentials = await this.getCredentials("signalCliApi");
    if (!credentials.url) {
      throw new NodeApiError(this.getNode(), {
        message: "Signal CLI API URL is not set in credentials",
      });
    }
    const url = `${credentials.url}/api/v1/events`;

    const eventSource = new EventSource(url);

    eventSource.addEventListener('error', (err) => {
      this.logger.error("EventSource error", {
        error: err,
        message: (err as any).message || 'Unknown error',
      });
    });

    eventSource.addEventListener('open', () => {
      signalTriggerDebug("Connected to %s", url);
      this.logger.info("SignalTrigger connected to Signal CLI API", { url });
    });
    
    eventSource.addEventListener('receive', (event) => {
      signalTriggerDebug("Received event: %o", event);
      const eventData = jsonParse<IDataObject>(event.data as string, {
        errorMessage: 'Invalid JSON for event data from Signal API',
      });
      
      // Log the full data structure for debugging
      this.logger.info("Signal event received", { 
        eventData: JSON.stringify(eventData),
        hasDataMessage: !!eventData.dataMessage,
        hasMessage: !!(eventData.dataMessage as IDataObject)?.message
      });
      
      this.emit([this.helpers.returnJsonArray([eventData])]);
    });



    

    async function closeFunction() {
      eventSource.close();
    }

    return {
      closeFunction,
    };
  }
}
