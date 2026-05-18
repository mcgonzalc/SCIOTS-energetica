import { privateKey } from "./generateKeys.js";

// RSA blind signature: signs the blinded message without seeing the original value.
// Client must unblind the result: s = blindSig * modInv(r, n) mod n
export function blindSign(blindedMessage: bigint): bigint {
    return privateKey.sign(blindedMessage);
}
