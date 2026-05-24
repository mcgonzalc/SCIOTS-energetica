
import { Request, Response } from "express";
import {
  issueAuthCode,
  consumeAuthCode,
  issueAccessToken,
} from "../services/energeticaAuth.js";
import { privateKey } from "../generateKeys.js";
import { blindSign } from "rsa";

/** Escapa valores antes de inyectarlos en el HTML de la pantalla de consentimiento. */
function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

interface ConsentParams {
  deviceId: string;
  serial: string;
  callback: string;
  state: string;
}

/**
 * Paso 2 — auth consent.
 * GET /register: el Device redirige aquí al User con la registration request.
 * La Energética muestra la pantalla de consentimiento (no descifra nada).
 */
export const consentPageHandler = (req: Request, res: Response) => {
  const deviceId = (req.query.device_id ?? "") as string;
  const serial = (req.query.serial ?? "") as string;
  const callback = (req.query.callback ?? "") as string;
  const state = (req.query.state ?? "") as string;

  if (!deviceId || !callback) {
    res
      .status(400)
      .send("Registration request inválida: faltan device_id o callback.");
    return;
  }

  res.status(200).send(renderConsentPage({ deviceId, serial, callback, state }));
};

/**
 * Paso 2 → 3.
 * POST /consent: el User concede o deniega el consentimiento.
 * Si lo concede, la Energética emite el auth_code y lo envía al Device
 * redirigiendo a su callback con ?code=...&state=...
 */
export const grantConsentHandler = async (req: Request, res: Response) => {
  try {
    const {
      device_id: deviceId,
      serial,
      callback,
      state,
      decision,
    } = req.body as Record<string, string>;

    if (!deviceId || !callback) {
      res.status(400).send("Faltan device_id o callback.");
      return;
    }

    // Consentimiento denegado → volver al Device con un error.
    if (decision !== "allow") {
      const denied = new URL(callback);
      denied.searchParams.set("error", "access_denied");
      if (state) denied.searchParams.set("state", state);
      res.redirect(302, denied.toString());
      return;
    }

    // Consentimiento concedido → emitir el auth_code.
    const authCode = await issueAuthCode({ deviceId, serial, callback, state });

    // Paso 3 — enviar el auth_code al Device a través de su callback.
    const redirect = new URL(callback);
    redirect.searchParams.set("code", authCode.code);
    if (state) redirect.searchParams.set("state", state);

    console.log(
      `[Energética] Paso 3 → auth_code emitido para device ${deviceId}, ` +
        `redirigiendo a ${redirect.toString()}`
    );

    res.redirect(302, redirect.toString());
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al conceder el consentimiento", error });
  }
};

/**
 * Paso 4 → 5 — token endpoint.
 * POST /token { code }: el Device canjea el auth_code. La Energética lo
 * valida (un solo uso) y devuelve el access token firmado con la privada.
 */
export const tokenHandler = async (req: Request, res: Response) => {
  try {
    const code = (req.body?.code ?? "") as string;
    if (!code) {
      res.status(400).json({ error: "invalid_request", message: "Falta el code" });
      return;
    }

    const authCode = await consumeAuthCode(code);
    if (!authCode) {
      res.status(400).json({
        error: "invalid_grant",
        message: "auth_code inválido, caducado o ya usado",
      });
      return;
    }

    const token = issueAccessToken({
      deviceId: authCode.deviceId,
      serial: authCode.serial,
    });

    console.log(
      `[Energética] Paso 4-5 → access token firmado emitido para device ${authCode.deviceId}`
    );

    res.status(200).json({
      access_token: token.accessToken,
      signature: token.signature,
      token_type: "bearer",
      expires_in: token.expiresIn,
    });
  } catch (error) {
    res.status(500).json({
      error: "server_error",
      message: "Error emitiendo el access token"
    });
  }
};

/** Pantalla mínima de consentimiento, en línea con la estética del Device. */
function renderConsentPage(p: ConsentParams): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Energética · Consentimiento</title>
  <style>
    body { margin:0; background:#0c0d0a; color:#e9e4d4;
      font-family:'JetBrains Mono', monospace; display:grid;
      place-items:center; min-height:100vh; }
    .card { border:1px solid #2a2b22; padding:32px 40px; max-width:460px;
      width:100%; box-sizing:border-box; }
    h1 { font-size:18px; letter-spacing:0.06em; margin:0 0 10px; }
    .accent { color:#ffb547; }
    p { color:#9a9886; font-size:13px; line-height:1.6; margin:0 0 20px; }
    .row { display:flex; justify-content:space-between; align-items:center;
      padding:9px 0; border-bottom:1px dashed #2a2b22; }
    .label { color:#7a7868; text-transform:uppercase; font-size:10px;
      letter-spacing:0.1em; }
    .value { color:#ffb547; font-size:13px; }
    .actions { display:flex; gap:12px; margin-top:26px; }
    button { flex:1; appearance:none; border:none; font-family:inherit;
      font-weight:700; font-size:12px; letter-spacing:0.1em;
      text-transform:uppercase; padding:14px; cursor:pointer; }
    .allow { background:#ffb547; color:#0c0d0a; }
    .deny { background:transparent; color:#9a9886; border:1px solid #2a2b22; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Autorizar <span class="accent">dispositivo</span></h1>
    <p>Este dispositivo solicita permiso para enviar medidas en tu nombre.
      Revisa los datos y concede o deniega el acceso.</p>
    <div class="row"><span class="label">Device ID</span><span class="value">${esc(p.deviceId)}</span></div>
    <div class="row"><span class="label">Número de serie</span><span class="value">${esc(p.serial) || "—"}</span></div>
    <form method="POST" action="/consent">
      <input type="hidden" name="device_id" value="${esc(p.deviceId)}" />
      <input type="hidden" name="serial" value="${esc(p.serial)}" />
      <input type="hidden" name="callback" value="${esc(p.callback)}" />
      <input type="hidden" name="state" value="${esc(p.state)}" />
      <div class="actions">
        <button class="allow" type="submit" name="decision" value="allow">Autorizar</button>
        <button class="deny" type="submit" name="decision" value="deny">Denegar</button>
      </div>
    </form>
  </div>
</body>
</html>`;
}


export const blindSignHandler = async (req: Request, res: Response) => {
    try {
        const blinded = BigInt(req.body.blinded);
        const blindSig = blindSign(privateKey, blinded);
        res.status(200).json({ blindSig: blindSig.toString() });
    } catch (error) {
        res.status(500).json({ message: 'Error signing blinded message', error });
    }
};

