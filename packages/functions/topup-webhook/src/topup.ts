import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import verifyHmac256 from "core/src/hmacVerifier";
import {
	Payload,
	createUserWallet,
	getUserWallet,
	payloadSchema,
	updateUserWallet,
} from "core/src/userUtils";

import { Table } from "sst/node/table";

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocument.from(client);
const ssmClient = new SSMClient();

// Constant
const SSM_PATH_KEY_HMAC256_SECRET = "webhook-topup-hmac256-secret"; // systems-manager parameter store

export async function main(
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
	let hmacHeader =
		event.headers["Authorization"] ?? event.headers["authorization"];
	const body = event.body;
	if (!hmacHeader || !body) {
		console.error("Missing HMAC header or request body");
		return {
			statusCode: 400,
			body: JSON.stringify({ message: "Unauthorized Access" }),
		};
	}

	const [payload, errorMessage] = getPayloadObject(body);

	if (errorMessage) {
		console.error(errorMessage);
		return {
			statusCode: 400,
			body: JSON.stringify({ message: "Unauthorized Access" }),
		};
	}

	// payload validation
	const parsePayload = payloadSchema.safeParse(payload);
	if (!parsePayload.success) {
		console.error(parsePayload.error);
		console.error("Malformed request query body");
		return {
			statusCode: 400,
			body: JSON.stringify({ message: "Unauthorized Access" }),
		};
	}

	// get the hmac256 secret
	const hmacSecret = await ssmClient.send(
		new GetParameterCommand({
			Name: SSM_PATH_KEY_HMAC256_SECRET,
			WithDecryption: true, // to get the real value
		})
	);
	const secret = hmacSecret.Parameter?.Value ?? "";

	hmacHeader = hmacHeader.replace(/ /g, "");

	const isValid = verifyHmac256.encodeInHex.verify({
		signature: hmacHeader,
		secret,
		payload: body,
	});

	if (!isValid) {
		console.error("hmac verification failed");
		return {
			statusCode: 400,
			body: JSON.stringify({ message: "Unauthorized Access" }),
		};
	}

	/**
	 * Since transactions maximum can only contain 10 item at maximum loop the transactions seems okay
	 */
	const failedTransactions: Payload["transactions"] = [];
	const successTransactions: Payload["transactions"] = [];

	for (const transaction of parsePayload.data.transactions) {
		const { user_id } = transaction;

		const tableName = Table.PaymentSystem.tableName;

		const userWallet = await getUserWallet(ddbDocClient, tableName, user_id);

		if (!userWallet.Item) {
			// user not yet exist let create a wallet
			const [_, createUserAccountErrMsg] = await createUserWallet(
				ddbDocClient,
				tableName,
				transaction
			);

			if (createUserAccountErrMsg) {
				console.error(createUserAccountErrMsg);
				failedTransactions.push(transaction);
				continue;
			}
			successTransactions.push(transaction);
		}

		const [_, updateUserBalanceErrMsg] = await updateUserWallet(
			ddbDocClient,
			tableName,
			{ ...transaction, previousBalance: userWallet.Item?.walletBalance ?? 0 }
		);
		if (updateUserBalanceErrMsg) {
			console.error(updateUserBalanceErrMsg);
			failedTransactions.push(transaction);
			continue;
		}

		successTransactions.push(transaction);
	}

	return {
		statusCode: 200,
		body: JSON.stringify({
			successfull_transactions: successTransactions,
			failed_transactions: failedTransactions,
		}),
	};
}

function getPayloadObject<T>(body: string): [T | null, string | null] {
	let errorMsg = "";
	if (!body.trim()) {
		errorMsg = "Empty request body. Please provide a valid JSON string.";
	}

	try {
		return [JSON.parse(body), null];
	} catch (e) {
		errorMsg =
			"Failed to parse request body. Ensure that the request body is a valid JSON string.";
	}

	return [null, errorMsg];
}
