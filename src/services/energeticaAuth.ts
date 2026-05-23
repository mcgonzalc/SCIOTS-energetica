import crypto from "crypto";
import AuthCode, { IAuthCode } from "../models/authCode.js";

/** Los auth codes son muy efímeros (5 min). */
const CODE_TTL_MS = 5 * 60 * 1000;

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
 * Paso 4 (para más adelante): canjea el auth_code por el access token.
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