
import {
  ITriggerFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
  ITriggerResponse,
} from 'n8n-workflow';
import { EventSource } from 'eventsource';
import debug from 'debug';

const signalTriggerDebug = debug('n8n:nodes:signal-trigger');

export class SignalTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Signal Trigger',
    name: 'signalTrigger',
    group: ['trigger'],
    version: 1,
    description: 'Triggers when a new message is received',
    defaults: {
      name: 'Signal Trigger',
    },
		inputs: [],
		outputs: ['main'],
    credentials: [
      {
        name: 'signalCliApi',
        required: true,
      },
    ],
    properties: [
    ],
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const credentials = await this.getCredentials('signalCliApi');
    if (!credentials.url) {
      throw new NodeApiError(this.getNode(), { message: 'Signal CLI API URL is not set in credentials' });
    }
    const url = `${credentials.url}/api/v1/events`;

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      signalTriggerDebug('Received event: %o', event);
      try {
        const data = JSON.parse(event.data);
        const message = data.dataMessage?.message;
        if (message) {
          const item: INodeExecutionData = {
            json: { message },
          };
          this.emit([this.helpers.returnJsonArray([item])]);
        }
      } catch (error) {
        this.logger.error('Error parsing message from Signal API', { error });
      }
    };

    

    return new Promise((resolve, reject) => {
      eventSource.onerror = (err) => {
        this.logger.error('EventSource error', {err: err, message: err.message});
        reject(err);
      };

      eventSource.onopen = () => {
        signalTriggerDebug('Connected to %s', url);

        eventSource.onerror = (err) => {
          this.logger.error('EventSource error', {error: err });
        };

        resolve({
          closeFunction: async () => {
            eventSource.close();
          },
        });
      }
    });

    

  }
}
