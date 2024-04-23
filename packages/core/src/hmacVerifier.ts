import * as crypto from "crypto";

type HashDigestOptions = {
	secret: string;
	payload: string;
};

type VerifyOptions = {
	signature: Buffer | string; // Changed from string to Buffer
	secret: string;
	payload: string;
};

type Encoding = "base64" | "base64url" | "binary" | "hex";

const hashDigest = (
	digestEncoding: Encoding
): ((options: HashDigestOptions) => string) => {
	return ({ secret, payload }: HashDigestOptions) => {
		const hmac = crypto
			.createHmac("sha256", secret)
			.update(payload)
			.digest(digestEncoding);
		return hmac.toString(); // Convert Buffer to string
	};
};

const verify = (
	hash: (options: HashDigestOptions) => string // Changed return type to string
): ((options: VerifyOptions) => boolean) => {
	return ({ signature, secret, payload }) => {
		const hashedPayload = hash({ secret, payload });
		return crypto.timingSafeEqual(
			typeof signature === "string" ? Buffer.from(signature) : signature,
			Buffer.from(hashedPayload) // Convert string to Buffer
		);
	};
};

const encodeIn = (
	encoding: Encoding
): {
	hash: (options: HashDigestOptions) => string;
	verify: (options: VerifyOptions) => boolean;
} => {
	const hash = hashDigest(encoding);
	const verifyInSuchEncoding = verify(hash);
	return {
		hash,
		verify: verifyInSuchEncoding,
	};
};

const encodeInHex = encodeIn("hex");
const encodeInBase64 = encodeIn("base64");

const mod = {
	...encodeInHex,
	encodeInHex,
	encodeInBase64,
};

export default mod;
