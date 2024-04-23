import { Api, ApiRouteProps, StackContext, Table } from "sst/constructs";

export function DigitalWalletTopUpStack({ stack }: StackContext) {
	// Create the table
	const table = new Table(stack, "PaymentSystem", {
		fields: {
			pk: "string",
			sk: "string",
			userId: "string",
			userName: "string",
			walletBalance: "number",
			transactionId: "string",
			amount: "number",
			description: "string",
			type: "string",
			typeMethod: "string",
			state: "string",
			currency: "string",
			debitCredit: "string",
			createdAt: "string",
			updatedAt: "string",
		},
		primaryIndex: { partitionKey: "pk", sortKey: "sk" },
	});

	// Create the HTTP API

	const routes: Record<string, ApiRouteProps<string>> = {};

	const walletTopUpWebhookEndpoint = "/v1/wallet/top-up/notify";
	routes[`POST ${walletTopUpWebhookEndpoint}`] =
		"packages/functions/topup-webhook/src/topup.main";

	const userWalletEndpoint = "/v1/users/{userId}/wallet";
	routes[`GET ${userWalletEndpoint}`] =
		"packages/functions/users/src/getUserWallet.main";

	const userPaymentTransactionsEndpoint =
		"/v1/users/{userId}/payment-transactions";
	routes[`GET ${userPaymentTransactionsEndpoint}`] =
		"packages/functions/users/src/getPaymentTransaction.main";

	const api = new Api(stack, "DigitalWalletTopUpApi", {
		defaults: {
			function: {
				// Bind the table name to our API
				bind: [table],
				permissions: ["ssm"],
			},
		},
		routes,
	});

	// Show the API endpoint in the output
	stack.addOutputs({
		ApiEndpoint: api.url,
		WebhookUrl: `POST ${api.url}${walletTopUpWebhookEndpoint}`,
		UserWalletAccountUrl: `GET ${api.url}${userWalletEndpoint}`,
		UserPaymentTransactions: `GET ${api.url}${userPaymentTransactionsEndpoint}`,
	});
}
