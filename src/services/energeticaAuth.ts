import crypto from "crypto";
import { signMessage } from "rsa";
import AuthCode, { IAuthCode } from "../models/authCode.js";
import { privateKey } from "../generateKeys.js";

/** Los auth codes son muy efímeros (5 min). */
const CODE_TTL_MS = 5 * 60 * 1000;

/** El access token dura 1 hora. */
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface ConsentGrant {
  deviceId: string;
  serial?: string;
  callback: string;
  state?: string;
}

/**
 * Paso 2 → 3: una vez concedido el consentimiento, genera un auth_code
 * opaco, lo persiste y lo devuelve para enviárselo al Device.
 */
export const issueAuthCode = async (
  grant: ConsentGrant
): Promise<IAuthCode> => {
  const code = crypto.randomBytes(32).toString("hex");
  const now = new Date();

  const authCode = new AuthCode({
    code,
    deviceId: grant.deviceId,
    serial: grant.serial,
    callback: grant.callback,
    state: grant.state,
    used: false,
    createdAt: now,
    expiresAt: new Date(now.getTime() + CODE_TTL_MS),
  });

  return await authCode.save();
};

/**
 * Paso 4: canjea el auth_code por el access token.
 * Marca el código como usado para impedir su reutilización.
 */
export const consumeAuthCode = async (
  code: string
): Promise<IAuthCode | null> => {
  const found = await AuthCode.findOne({ code, used: false });
  if (!found) return null;
  if (found.expiresAt.getTime() < Date.now()) return null;

  found.used = true;
  await found.save();
  return found;
};

export interface AccessTokenResult {
  /** Payload del token codificado en base64url. */
  accessToken: string;
  /** Firma RSA del token, serializada como string. */
  signature: string;
  /** Validez en segundos. */
  expiresIn: number;
}

/**
 * Paso 5: construye el access token y lo firma con la clave privada de la
 * energética usando la librería RSA. El Device lo verificará con la pública.
 */
export const issueAccessToken = (claims: {
  deviceId: string;
  serial?: string;
}): AccessTokenResult => {
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + ACCESS_TOKEN_TTL_MS / 1000;

  const payload = {
    sub: claims.deviceId,
    serial: claims.serial,
    iat: nowSec,
    exp: expSec,
  };

  const accessToken = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signMessage(privateKey, accessToken);

  return {
    accessToken,
    signature: signature.toString(),
    expiresIn: ACCESS_TOKEN_TTL_MS / 1000,
  };
};