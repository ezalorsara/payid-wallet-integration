import { Transaction, UserWallet } from "core/src/userUtils";
import dotenv from "dotenv";
dotenv.config({ path: "../../../../../.env" });

import { test } from "vitest";

const url = process.env?.API_URL ?? "";
const topupUrl = `${url}/v1/wallet/top-up/notify`;
const getListTransactionUrl = (userId: string) => {
	return `${url}/v1/users/${userId}/payment-transactions`;
};
const getUserwalletUrl = (userId: string) => {
	return `${url}/v1/users/${userId}/wallet`;
};

test("should return wallet info of test account user2", async ({ expect }) => {
	const headers = new Headers({
		"Content-Type": "application/json",
		Authorization:
			"ed326f4819e7ac395b93bbab8ab7a16568480bc04f0784daeb9c7b6d750a432d",
	});
	const userId = "user2";
	const userWalletUrl = getUserwalletUrl(userId);
	const userTransactionsUrl = getListTransactionUrl(userId);
	const body = JSON.stringify({
		transactions: [
			{
				id: "1231cb10-0202-0138-225b-028e897a1111",
				created_at: "2019-12-17T07:20:14.966Z",
				updated_at: "2019-12-17T07:20:14.966Z",
				description:
					"Credit of $4.00 to Wallet Account by Debit of $4.00 from NPP Payin Funding Account",
				type: "deposit",
				type_method: "npp_payin",
				state: "successful",
				user_id: userId,
				user_name: "Test2 User",
				amount: "5.11",
				currency: "AUD",
				debit_credit: "credit",
			},
			{
				id: "1231cb10-0202-0138-225b-028e897a2222",
				created_at: "2019-12-17T07:20:14.966Z",
				updated_at: "2019-12-17T07:20:14.966Z",
				description:
					"Credit of $4.00 to Wallet Account by Debit of $4.00 from NPP Payin Funding Account",
				type: "deposit",
				type_method: "npp_payin",
				state: "successful",
				user_id: userId,
				user_name: "Test2 User",
				amount: "4.89",
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

	const userTransactionsJson = (await userTransactionResponse.json()) as {
		items: Transaction[];
	};
	expect(userTransactionsJson.items.length).toBe(2); // should always be 2 since always its the same transaction

	const userWalletResponse = await fetch(userWalletUrl, {
		method: "GET",
	});
	expect(userTransactionResponse.status).toBe(200);

	const userWalletJson = (await userWalletResponse.json()) as UserWallet;
	expect(userWalletJson.userId).toBe(userId);
	expect(userWalletJson.userName).toBe("Test2 User");
	expect(userWalletJson.walletBalance).toBe(1000); // we created a two transaction for user2 5.11 and 4.89 should be 1000 after converting to cents
}, 20000);

/**
 * Add more test coverage here
 */
