import { RsaPublicKey, RsaPrivateKey, generateKeyPair } from "rsa";
import fs from "fs";
import path from "path";

/**
 * Persistimos el par de claves para que NO cambie en cada arranque.
 * Si cambiara, el Agregador (que cachea la pública al levantarse) cifraría
 * con una pública que ya no corresponde a esta privada, y el descifrado
 * devolvería un bigint erróneo.
 */
const KEY_PATH = path.join(process.cwd(), "keys.json");

let publicKey: RsaPublicKey;
let privateKey: RsaPrivateKey;

if (fs.existsSync(KEY_PATH)) {
  const saved = JSON.parse(fs.readFileSync(KEY_PATH, "utf8")) as {
    n: string;
    e: string;
    d: string;
  };
  publicKey = new RsaPublicKey(BigInt(saved.n), BigInt(saved.e));
  privateKey = new RsaPrivateKey(BigInt(saved.n), BigInt(saved.d));
} else {
  const keypair = generateKeyPair(2048);
  publicKey = keypair.publicKey;
  privateKey = keypair.privateKey;
  fs.writeFileSync(
    KEY_PATH,
    JSON.stringify({
      n: publicKey.n.toString(),
      e: publicKey.e.toString(),
      d: privateKey.d.toString(),
    })
  );
}

export { publicKey, privateKey };

export const publicKeyJson = {
  n: publicKey.n.toString(),
  e: publicKey.e.toString(),
};

export const privateKeyJson = {
  n: privateKey.n.toString(),
  d: privateKey.d.toString(),
};