import { SharedArray } from "k6/data";
import { Options } from "k6/options";
import exec from "k6/execution";
import crypto from "k6/crypto";
import http from "k6/http";
import { check } from "k6";

export const users = [
  {
    id: "1-ec3c-4c0b-a326-e2cfaadaa3a6",
    user_name: "user1@linkedin.in",
  },
  {
    id: "2-ec3c-4c0b-a326-e2cfaadaa3a6",
    user_name: "user2@linkedin.in",
  },
  {
    id: "3-ec3c-4c0b-a326-e2cfaadaa3a6",
    user_name: "user3@linkedin.in",
  },
  {
    id: "4-ec3c-4c0b-a326-e2cfaadaa3a6",
    user_name: "user4@linkedin.in",
  },
  {
    id: "5-ec3c-4c0b-a326-e2cfaadaa3a6",
    user_name: "user5@linkedin.in",
  },
  {
    id: "6-ec3c-4c0b-a326-e2cfaadaa3a6",
    user_name: "user6@linkedin.in",
  },
  {
    id: "7-ec3c-4c0b-a326-e2cfaadaa3a6",
    user_name: "user7@linkedin.in",
  },
  {
    id: "8-ec3c-4c0b-a326-e2cfaadaa3a6",
    user_name: "user8@linkedin.in",
  },
  {
    id: "9-ec3c-4c0b-a326-e2cfaadaa3a6",
    user_name: "user9@linkedin.in",
  },
  {
    id: "10-ec3c-4c0b-a326-e2cfaadaa3a6",
    user_name: "user10@linkedin.in",
  },
];

const uuids = [
  "1-0202-0138-225b-028e897a70a5",
  "2-0202-0138-225b-028e897a70a5",
  "3-0202-0138-225b-028e897a70a5",
  "4-0202-0138-225b-028e897a70a5",
  "5-0202-0138-225b-028e897a70a5",
  "6-0202-0138-225b-028e897a70a5",
  "7-0202-0138-225b-028e897a70a5",
  "8-0202-0138-225b-028e897a70a5",
  "9-0202-0138-225b-028e897a70a5",
  "10-0202-0138-225b-028e897a70a5",
];

const randNumber = (maxNumber: number) => {
  return Math.round(Math.random() * maxNumber) - 1;
}; // random number 0 - maxNumber

export function createTransactionPayload() {
  const uuidIndex = randNumber(10);
  const amount = randNumber(1000);
  const user = users[randNumber(10)];
  return {
    id: uuids[uuidIndex],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    description: `Credit of $${amount} to Wallet Account by Debit of $${amount}.00 from NPP Payin Funding Account`,
    type: "deposit",
    type_method: "npp_payin",
    state: "successful",
    user_id: user.id,
    user_name: user.user_name,
    amount: amount.toString(),
    currency: "AUD",
    debit_credit: "credit",
  };
}

export const options: Options = {
  scenarios: {
    loadTransaction: {
      executor: "per-vu-iterations",
      vus: 2,
      iterations: 2,
      maxDuration: "5m",
    },
  },
};

export default function test() {
  const secret = __ENV.HMAC_SECRET;
  const notifyUrl = __ENV.NOTIFY_URL;

  const payload = JSON.stringify({
    transactions: [createTransactionPayload()],
  });

  const encryption = crypto.hmac("sha256", secret, payload, "hex");

  const params = {
    headers: {
      Authorization: encryption,
      "Content-Type": "application/json",
    },
  };

  const res = http.post(notifyUrl, payload, params);
  const jsonRes = res.json();

  check(res, {
    "transaction ": (r) => r.status === 200,
  });

  console.log(jsonRes);
}
