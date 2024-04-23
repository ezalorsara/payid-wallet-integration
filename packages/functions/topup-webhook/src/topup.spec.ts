import dotenv from "dotenv";
dotenv.config({ path: "../../../../../.env" });

import { test } from "vitest";

const url = process.env?.API_URL ?? "";
const topupUrl = `${url}/v1/wallet/top-up/notify`;

test("should return Unauthorized Access", async ({ expect }) => {
	const headers = new Headers({
		"Content-Type": "application/json",
	});

	const body = JSON.stringify({ transactions: [] });

	const response = await fetch(topupUrl, {
		method: "POST",
		headers: headers,
		body: body,
	});
	expect(response.status).toBe(400);
});

test("should return 200 given correct authorization header", async ({
	expect,
}) => {
	const headers = new Headers({
		Authorization:
			"7d07f4aa2f56f8f8d31829e6196b5c15e34a56a86f7495375e6c6b20fd840fe2",
		"Content-Type": "application/json",
	});

	const body = JSON.stringify({ transactions: [] });

	const response = await fetch(topupUrl, {
		method: "POST",
		headers: headers,
		body: body,
	});
	console.log(response.body);
	expect(response.status).toBe(200);
});

test("should return 400 for malformed body missing property state", async ({
	expect,
}) => {
	const headers = new Headers({
		Authorization:
			"7d07f4aa2f56f8f8d31829e6196b5c15e34a56a86f7495375e6c6b20fd840fe2",
		"Content-Type": "application/json",
	});

	const body = JSON.stringify({
		transactions: [
			{
				id: "1231cb10-0202-0138-225b-028e897a70a6",
				created_at: "2019-12-17T07:20:14.966Z",
				updated_at: "2019-12-17T07:20:14.966Z",
				description:
					"Credit of $4.00 to Wallet Account by Debit of $4.00 from NPP Payin Funding Account",
				type: "deposit",
				type_method: "npp_payin",
				user_id: "449416d8-ec3c-4c0b-a326-e2cfaadaa3a6",
				user_name: "Neol Buyer",
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
	console.log(response.body);
	expect(response.status).toBe(400);
});

/**
 * Add more test coverage here
 */
