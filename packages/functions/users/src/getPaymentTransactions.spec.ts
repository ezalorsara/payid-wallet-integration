import { Transaction } from "core/src/userUtils";
import dotenv from "dotenv";
dotenv.config({ path: "../../../../../.env" });

import { test } from "vitest";

const url = process.env?.API_URL ?? "";
const topupUrl = `${url}/v1/wallet/top-up/notify`;
const getListTransactionUrl = (userId: string) => {
	return `${url}/v1/users/${userId}/payment-transactions`;
};

test("should return list of transactions of user1", async ({ expect }) => {
	const headers = new Headers({
		"Content-Type": "application/json",
		Authorization:
			"bd6822eef79c90aabe731da5d75517c3d55034db3699539130a35a9b7ee50297",
	});
	const userId = "user1";
	const userTransactionsUrl = getListTransactionUrl(userId);
	const body = JSON.stringify({
		transactions: [
			{
				id: "1231cb10-0202-0138-225b-028e897a7022",
				created_at: "2019-12-17T07:20:14.966Z",
				updated_at: "2019-12-17T07:20:14.966Z",
				description:
					"Credit of $4.00 to Wallet Account by Debit of $4.00 from NPP Payin Funding Account",
				type: "deposit",
				type_method: "npp_payin",
				state: "successful",
				user_id: userId,
				user_name: "Test User",
				amount: "4.00",
				currency: "AUD",
				debit_credit: "credit",
			},
		],
	});

	const response = await fetch(topupUrl, {
		method: "POST",
		headers: headers,
		body: body,
	});
	expect(response.status).toBe(200);

	const userTransactionResponse = await fetch(userTransactionsUrl, {
		method: "GET",
	});
	expect(userTransactionResponse.status).toBe(200);

	const json = (await userTransactionResponse.json()) as {
		items: Transaction[];
	};
	expect(json.items.length).toBe(1); // should always be one since its always the same transaction
}, 10000);

/**
 * Add more test coverage here
 */
