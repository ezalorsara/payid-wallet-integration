import { SSTConfig } from "sst";
import { DigitalWalletTopUpStack } from "./stacks/DigitalWalletTopUpStack";

export default {
	config(_input) {
		return {
			name: "payid-wallet-integration",
			region: "us-east-1",
			profile: _input.stage === "production" ? "mary" : "mary",
		};
	},
	stacks(app) {
		app.stack(DigitalWalletTopUpStack);
	},
} satisfies SSTConfig;
