import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
	Transaction,
	base64ToJson,
	encodeLastEvaluatedKey,
	getTransactionsByUserId,
} from "core/src/userUtils";

import { Table } from "sst/node/table";
import { z } from "zod";

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocument.from(client);

export const pathParamsSchema = z.object({
	userId: z.string(),
});

export const queryStringSchema = z
	.object({
		sort: z.enum(["asc", "desc"]).optional(),
		lastEvaluatedKey: z.string().optional(),
	})
	.optional();

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

	const queryParams = queryStringSchema.safeParse(event.queryStringParameters);
	if (!queryParams.success) {
		console.error(queryParams.error);
		return {
			statusCode: 400,
			body: "Invalid request",
		};
	}

	const q = queryParams.data;

	const usersTransaction = await getTransactionsByUserId(
		ddbDocClient,
		tableName,
		userId,
		q?.sort,
		q?.lastEvaluatedKey
	);

	return {
		statusCode: 200,
		body: JSON.stringify(
			mapTransactionsResult(
				usersTransaction?.Items ?? [],
				usersTransaction.LastEvaluatedKey
			)
		),
	};
}

function mapTransactionsResult(
	data: Transaction[],
	lastEvaluatedKey: Record<string, any> | undefined
) {
	const items = data.map((transaction) => {
		const {
			userId,
			transactionId,
			amount,
			description,
			type,
			typeMethod,
			state,
			currency,
			debitCredit,
			createdAt,
			updatedAt,
		} = transaction;

		return {
			userId,
			transactionId,
			amount,
			description,
			type,
			typeMethod,
			state,
			currency,
			debitCredit,
			createdAt,
			updatedAt,
		};
	});

	return {
		items,
		lastEvaluatedKey: encodeLastEvaluatedKey(lastEvaluatedKey),
	};
}
