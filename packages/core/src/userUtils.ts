import {
	DynamoDBDocument,
	GetCommand,
	GetCommandInput,
	GetCommandOutput,
	QueryCommandInput,
	TransactWriteCommand,
	TransactWriteCommandInput,
	TransactWriteCommandOutput,
	QueryCommand,
	QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

export interface UserWallet {
	userId: string;
	walletBalance: number;
	userName: string;
	createdAt: string;
	updatedAt: string;
}

export interface Transaction {
	userId: string;
	transactionId: string;
	amount: number;
	description: string;
	type: string;
	typeMethod: string;
	state: string;
	currency: string;
	debitCredit: string;
	createdAt: string;
	updatedAt: string;
}

export const payloadSchema = z.object({
	transactions: z.array(
		z.object({
			id: z.string(),
			created_at: z.string(),
			updated_at: z.string(),
			description: z.string(),
			type: z.enum(["deposit"]),
			type_method: z.enum(["npp_payin"]),
			state: z.enum(["successful", "failed"]),
			user_id: z.string(),
			user_name: z.string(),
			amount: z.string().regex(/^\d+(\.\d{1,12})?$/),
			currency: z.enum(["AUD"]),
			debit_credit: z.enum(["credit"]),
		})
	),
});

export type Payload = z.infer<typeof payloadSchema>;
export type TransactionPayload = Payload["transactions"][number];

export async function getUserWallet(
	ddbDocClient: DynamoDBDocument,
	tableName: string,
	userId: string
) {
	const getParams: GetCommandInput = {
		TableName: tableName,
		Key: {
			pk: `USER#${userId}`,
			sk: `WALLET#${userId}`,
		},
	};

	return (await ddbDocClient.send(new GetCommand(getParams))) as Omit<
		GetCommandOutput,
		"Item"
	> & { Item?: UserWallet };
}

export async function createUserWallet(
	ddbDocClient: DynamoDBDocument,
	tableName: string,
	data: TransactionPayload
): Promise<[TransactWriteCommandOutput | null, string | null]> {
	const {
		id,
		user_id,
		created_at,
		amount,
		user_name,
		updated_at,
		description,
		type,
		type_method,
		state,
		currency,
		debit_credit,
	} = data;

	const floatAmount = parseFloat(amount);
	if (isNaN(floatAmount)) {
		return [null, "Amount is not a number"];
	}

	let errorMessage = "";
	const transactItems: TransactWriteCommandInput = {
		TransactItems: [
			{
				Put: {
					TableName: tableName,
					Item: {
						pk: `USER#${user_id}`,
						sk: `WALLET#${user_id}`,
						userId: user_id,
						userName: user_name,
						walletBalance: convertToCents(floatAmount),
						createdAt: created_at,
						updatedAt: updated_at,
					},
				},
			},
			{
				Put: {
					TableName: tableName,
					Item: {
						pk: `USER#${user_id}`,
						sk: `TRANSACTION#${id}#CREATED_AT#${created_at}`,
						userId: user_id,
						transactionId: id,
						description,
						type,
						typeMethod: type_method,
						state,
						currency,
						debitCredit: debit_credit,
						amount: convertToCents(floatAmount),
						createdAt: created_at,
						updatedAt: updated_at,
					},
				},
			},
		],
	};

	try {
		const result = await ddbDocClient.send(
			new TransactWriteCommand(transactItems)
		);

		return [result, null];
	} catch (e) {
		console.error(e);
		errorMessage = "Payment failed to process.";
	}

	return [null, errorMessage];
}

export async function updateUserWallet(
	ddbDocClient: DynamoDBDocument,
	tableName: string,
	data: TransactionPayload & { previousBalance: number }
): Promise<[TransactWriteCommandOutput | null, string | null]> {
	const {
		id,
		user_id,
		amount,
		created_at,
		updated_at,
		description,
		type,
		type_method,
		state,
		currency,
		debit_credit,
	} = data;
	let errorMessage = "";

	const floatAmount = parseFloat(amount);
	if (isNaN(floatAmount)) {
		return [null, "Amount is not a number"];
	}

	const transactItems: TransactWriteCommandInput = {
		TransactItems: [
			{
				Put: {
					TableName: tableName,
					Item: {
						pk: `USER#${user_id}`,
						sk: `TRANSACTION#${id}#CREATED_AT#${created_at}`,
						userId: user_id,
						transactionId: id,
						description,
						type,
						typeMethod: type_method,
						state,
						currency,
						debitCredit: debit_credit,
						amount: convertToCents(floatAmount),
						createdAt: created_at,
						updatedAt: updated_at,
					},
					ExpressionAttributeNames: {
						"#pk": "pk",
						"#sk": "sk",
					},
					ConditionExpression:
						"attribute_not_exists(#pk) and attribute_not_exists(#sk)",
				},
			},
		],
	};

	/**
	 * For updating user wallet if the transaction state is not successfull, we don't want to update the user wallet
	 */
	if (state === "successful") {
		transactItems.TransactItems?.push({
			Update: {
				TableName: tableName,
				Key: { pk: `USER#${user_id}`, sk: `WALLET#${user_id}` },
				UpdateExpression:
					"SET walletBalance=:walletBalance, updatedAt=:updatedAt",
				ExpressionAttributeValues: {
					":walletBalance": data.previousBalance + convertToCents(floatAmount),
					":updatedAt": updated_at,
				},
			},
		});
	}

	try {
		const result = await ddbDocClient.send(
			new TransactWriteCommand(transactItems)
		);

		return [result, null];
	} catch (e) {
		console.error(e);
		errorMessage = "Payment failed to process.";
	}

	return [null, errorMessage];
}

export async function getTransactionsByUserId(
	ddbDocClient: DynamoDBDocument,
	tableName: string,
	userId: string,
	sort?: "asc" | "desc" | undefined,
	exclusiveStartKey?: string | undefined
) {
	let sortValue = "asc"; // dynamodb default is ascending
	if (sort) {
		sortValue = sort;
	}

	const queryCommandInput: QueryCommandInput = {
		TableName: tableName,
		KeyConditionExpression: "#pk = :pk and begins_with(#sk, :sk)",
		ExpressionAttributeValues: {
			":pk": `USER#${userId}`,
			":sk": `TRANSACTION#`,
		},
		ExpressionAttributeNames: {
			"#pk": "pk",
			"#sk": "sk",
		},
		ScanIndexForward: sortValue === "asc",
		Limit: 1,
	};

	if (exclusiveStartKey) {
		queryCommandInput.ExclusiveStartKey = base64ToJson(exclusiveStartKey);
	}

	const result = await ddbDocClient.send(new QueryCommand(queryCommandInput));

	return result as Omit<QueryCommandOutput, "Items"> & {
		Items?: Transaction[];
	};
}

export function convertToCents(amount: number) {
	return amount * 100;
}

export function base64ToJson(base64String: string): any {
	const json = Buffer.from(base64String, "base64").toString();
	return JSON.parse(json);
}

export function encodeLastEvaluatedKey(
	lastEvaluatedKey?: any
): string | undefined {
	if (lastEvaluatedKey) {
		return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString("base64");
	}
	return undefined;
}
