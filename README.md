# How to use DynamoDB in your serverless app

An example serverless app created with SST.

## Getting started

1.) install and setup aws cli v2, here is the [instruction](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2.) configure your aws account profile e.g

```bash
    aws configure --profile mary
```

3.) clone this repository and go to directory and install dependencies

```bash
git clone git@github.com:ezalorsara/payid-wallet-integration.git
cd payid-wallet-integration
pnpm i
```

4.) Check the sst.config.ts file; you might need to adjust the profile value based on the profile name you used. For instance, if you maintain separate AWS accounts for development and production, and you've set up profiles like so:

```bash
aws configure --profile primeagen-prod
aws configure --profile primeagen-dev
```

Then in your sst.config.ts file, you would conditionally set the profile like this:

```typescript
profile: _input.stage === "production" ? "primeagen-prod" : "primeagen-dev",
```

5.) go to aws console and create a parameter store with name "webhook-topup-hmac256-secret"
and store your hmac254 value e.g

```bash
4e8ed8cb73ab6a502d02825a2912e2313a3ea7b3a9e88336083d28984de2605d
```

this is for HMAC authentication on webhook endpoint

6.) you can do.

```bash
pnpm run dev
```

this will deploy sst on dev stage

please see package.json you can test other scripts like pnpm run test, etc..

#### DigitalWalletTopUpStack - Example API Routes

| Name                    | Method | Path                                                                                          |
| ----------------------- | ------ | --------------------------------------------------------------------------------------------- |
| ApiEndpoint             |        | https://l1z8pbn8x3.execute-api.us-east-1.amazonaws.com                                        |
| UserPaymentTransactions | GET    | https://l1z8pbn8x3.execute-api.us-east-1.amazonaws.com/v1/users/{userId}/payment-transactions |
| UserWalletAccountUrl    | GET    | https://l1z8pbn8x3.execute-api.us-east-1.amazonaws.com/v1/users/{userId}/wallet               |
| WebhookUrl              | POST   | https://l1z8pbn8x3.execute-api.us-east-1.amazonaws.com/v1/wallet/top-up/notify                |
