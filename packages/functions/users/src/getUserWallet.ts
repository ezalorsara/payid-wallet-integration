import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UserWallet, getUserWallet } from "core/src/userUtils";

import { Table } from "sst/node/table";
import { z } from "zod";

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocument.from(client);

export const pathParamsSchema = z.object({
	userId: z.string(),
});

export async function main(
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
	const tableName = Table.PaymentSystem.tableName;

	const pathParams = pathParamsSchema.safeParse(event.pathParameters);

	if (!pathParams.success) {
		console.error(pathParams.error);
		return {
			statusCode: 400,
			body: "Invalid request",
		};
	}
	const { userId } = pathParams.data;

	const userWallet = await getUserWallet(ddbDocClient, tableName, userId);

	if (!userWallet.Item) {
		console.error(`user wallet with userId: ${userId} not found!`);
		return {
			statusCode: 400,
			body: "Invalid request",
		};
	}

	return {
		statusCode: 200,
		body: JSON.stringify(mapUserWalletResult(userWallet.Item)),
	};
}

function mapUserWalletResult(data: UserWallet) {
	const { userId, userName, walletBalance, createdAt, updatedAt } = data;

	return {
		userId,
		userName,
		walletBalance,
		createdAt,
		updatedAt,
	};
}
