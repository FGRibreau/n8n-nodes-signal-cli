import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Debug from 'debug';

const debug = Debug('n8n:signal');

export class Signal implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Signal',
		name: 'signal',
		group: ['output'],
		version: 1,
		description: 'Interact with Signal CLI API',
		defaults: {
			name: 'Signal',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'signalCliApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Contact',
						value: 'contact',
					},
					{
						name: 'Group',
						value: 'group',
					},
					{
						name: 'Message',
						value: 'message',
					},
					{
						name: 'Reaction',
						value: 'reaction',
					},
					{
						name: 'Receipt',
						value: 'receipt',
					},
				],
				default: 'message',
			},
			// Message properties
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						action: 'Send a message',
					},
				],
				default: 'send',
			},
			{
				displayName: 'Account',
				name: 'account',
				type: 'string',
				description: 'Phone number (international format)',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
			},
			{
				displayName: 'Recipient',
				name: 'recipient',
				type: 'string',
				default: '',
				required: true,
				description: 'Phone number (international format) or group ID of the recipient',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				required: true,
				description: 'The message to be sent',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
			},
			// Group properties
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['group'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a group',
					},
					{
						name: 'List',
						value: 'list',
						action: 'List a group',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Account',
				name: 'account',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['group'],
					},
				},
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				description: 'The name of the group',
				displayOptions: {
					show: {
						resource: ['group'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Members',
				name: 'members',
				type: 'string',
				default: '',
				required: true,
				description: 'Comma-separated list of members to add to the group',
				displayOptions: {
					show: {
						resource: ['group'],
						operation: ['create'],
					},
				},
			},
			// Contact properties
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['contact'],
					},
				},
				options: [
					{
						name: 'Update',
						value: 'update',
						action: 'Update a contact',
					},
					{
						name: 'List',
						value: 'list',
						action: 'List a contact',
					},
				],
				default: 'update',
			},
			{
				displayName: 'Account',
				name: 'account',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['contact'],
					},
				},
			},
			{
				displayName: 'Recipient',
				name: 'recipient',
				type: 'string',
				default: '',
				required: true,
				description: 'Phone number of the contact',
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['update'],
					},
				},
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'The name of the contact',
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['update'],
					},
				},
			},
			// Reaction properties
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['reaction'],
					},
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						action: 'Send a reaction',
					},
					{
						name: 'Remove',
						value: 'remove',
						action: 'Remove a reaction',
					},
				],
				default: 'send',
			},
			{
				displayName: 'Account',
				name: 'account',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['reaction'],
					},
				},
			},
			{
				displayName: 'Recipient',
				name: 'recipient',
				type: 'string',
				default: '',
				required: true,
				description: 'Phone number or group ID of the recipient',
				displayOptions: {
					show: {
						resource: ['reaction'],
						operation: ['send', 'remove'],
					},
				},
			},
			{
				displayName: 'Reaction',
				name: 'reaction',
				type: 'string',
				default: '',
				required: true,
				description: 'The reaction to be sent',
				displayOptions: {
					show: {
						resource: ['reaction'],
						operation: ['send', 'remove'],
					},
				},
			},
			{
				displayName: 'Target Author',
				name: 'targetAuthor',
				type: 'string',
				default: '',
				required: true,
				description: 'The author of the message being reacted to',
				displayOptions: {
					show: {
						resource: ['reaction'],
						operation: ['send', 'remove'],
					},
				},
			},
			{
				displayName: 'Timestamp',
				name: 'timestamp',
				type: 'number',
				default: 0,
				required: true,
				description: 'The timestamp of the message being reacted to',
				displayOptions: {
					show: {
						resource: ['reaction'],
						operation: ['send', 'remove'],
					},
				},
			},
			// Receipt properties
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['receipt'],
					},
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						action: 'Send a receipt',
					},
				],
				default: 'send',
			},
			{
				displayName: 'Account',
				name: 'account',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['receipt'],
					},
				},
			},
			{
				displayName: 'Recipient',
				name: 'recipient',
				type: 'string',
				default: '',
				required: true,
				description: 'Phone number or group ID of the recipient',
				displayOptions: {
					show: {
						resource: ['receipt'],
						operation: ['send'],
					},
				},
			},
			{
				displayName: 'Receipt Type',
				name: 'receiptType',
				type: 'options',
				options: [
					{
						name: 'Read',
						value: 'read',
					},
					{
						name: 'Viewed',
						value: 'viewed',
					},
				],
				default: 'read',
				required: true,
				displayOptions: {
					show: {
						resource: ['receipt'],
						operation: ['send'],
					},
				},
			},
			{
				displayName: 'Timestamp',
				name: 'timestamp',
				type: 'number',
				default: 0,
				required: true,
				description: 'The timestamp of the message being receipted',
				displayOptions: {
					show: {
						resource: ['receipt'],
						operation: ['send'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('signalCliApi');

		if (!credentials.url) {
			throw new NodeOperationError(this.getNode(), 'Signal CLI API URL is not set in credentials');
		}

		const url = `${credentials.url}/api/v1/rpc`;

		try {
			let response;
			debug('Signal Node: Executing with resource=%s, operation=%s', resource, operation);
			if (resource === "message" && operation === "send") {
        const account = this.getNodeParameter("account", 0) as string;
        const recipient = this.getNodeParameter("recipient", 0) as string;
        const message = this.getNodeParameter("message", 0) as string;
// check if the value of recipient is a group based on if there are alphabetical characters in the string
        const isTargetAGroup = /[a-zA-Z]/.test(recipient);

        const requestBody = {
          jsonrpc: "2.0",
          method: "send",
          params: {
            account,
            message,
//if value is group send with groupId prefix as required by Signal-cli, otherwise pass through as phone number via recipient
            [isTargetAGroup ? "groupId" : "recipient"]: recipient,
          },
          id: uuidv4(),
			
				};
				debug('Signal Node: Sending message with requestBody=%o', requestBody);
				response = await axios.post(`${url}`, requestBody);
			} else if (resource === 'group' && operation === 'create') {
				const account = this.getNodeParameter('account', 0) as string;
				const name = this.getNodeParameter('name', 0) as string;
				const members = (this.getNodeParameter('members', 0) as string).split(',');

				const requestBody = {
					jsonrpc: '2.0',
					method: 'updateGroup',
					params: {
						account,
						name,
						members,
					},
					id: uuidv4(),
				};
				debug('Signal Node: Creating group with requestBody=%o', requestBody);
				response = await axios.post(`${url}`, requestBody);
			} else if (resource === 'group' && operation === 'list') {
				const account = this.getNodeParameter('account', 0) as string;

				const requestBody = {
					jsonrpc: '2.0',
					method: 'listGroups',
					params: { account },
					id: uuidv4(),
				};

				response = await axios.post(`${url}`, requestBody);
			} else if (resource === 'contact' && operation === 'update') {
				const account = this.getNodeParameter('account', 0) as string;
				const recipient = this.getNodeParameter('recipient', 0) as string;
				const name = this.getNodeParameter('name', 0) as string;

				const requestBody = {
					jsonrpc: '2.0',
					method: 'updateContact',
					params: { account, recipient, name },
					id: uuidv4(),
				};

				response = await axios.post(`${url}`, requestBody);
			} else if (resource === 'contact' && operation === 'list') {
				const account = this.getNodeParameter('account', 0) as string;

				const requestBody = {
					jsonrpc: '2.0',
					method: 'listContacts',
					params: { account },
					id: uuidv4(),
				};

				response = await axios.post(`${url}`, requestBody);
			} else if (resource === 'reaction' && operation === 'send') {
				const account = this.getNodeParameter('account', 0) as string;
				const recipient = this.getNodeParameter('recipient', 0) as string;
				const reaction = this.getNodeParameter('reaction', 0) as string;
				const targetAuthor = this.getNodeParameter('targetAuthor', 0) as string;
				const timestamp = this.getNodeParameter('timestamp', 0) as number;

				const requestBody = {
					jsonrpc: '2.0',
					method: 'sendReaction',
					params: { account, recipient, reaction, targetAuthor, timestamp },
					id: uuidv4(),
				};

				response = await axios.post(`${url}`, requestBody);
			} else if (resource === 'reaction' && operation === 'remove') {
				const account = this.getNodeParameter('account', 0) as string;
				const recipient = this.getNodeParameter('recipient', 0) as string;
				const reaction = this.getNodeParameter('reaction', 0) as string;
				const targetAuthor = this.getNodeParameter('targetAuthor', 0) as string;
				const timestamp = this.getNodeParameter('timestamp', 0) as number;

				const requestBody = {
					jsonrpc: '2.0',
					method: 'sendReaction',
					params: { account, recipient, reaction, targetAuthor, timestamp, remove: true },
					id: uuidv4(),
				};

				response = await axios.post(`${url}`, requestBody);
			} else if (resource === 'receipt' && operation === 'send') {
				const account = this.getNodeParameter('account', 0) as string;
				const recipient = this.getNodeParameter('recipient', 0) as string;
				const receiptType = this.getNodeParameter('receiptType', 0) as string;
				const timestamp = this.getNodeParameter('timestamp', 0) as number;

				const requestBody = {
					jsonrpc: '2.0',
					method: 'sendReceipt',
					params: { account, recipient, receiptType, timestamp },
					id: uuidv4(),
				};

				response = await axios.post(`${url}`, requestBody);
			}

			debug('Signal Node: Response', response?.data);
			const item: INodeExecutionData = {
				json: response?.data,
			};
			return [[item]];
		} catch (error) {
			throw new NodeOperationError(this.getNode(), 'Error interacting with Signal API', {
				itemIndex: 0,
			});
		}
	}
}
