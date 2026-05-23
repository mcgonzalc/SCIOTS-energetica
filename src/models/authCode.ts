import mongoose from "mongoose";

/**
 * AuthCode — código de autorización que la Energética emite tras el
 * auth_consent (paso 2) y envía al Device (paso 3) del diagrama.
 *
 * Es efímero y de un solo uso: el Device lo canjeará después por el
 * access token (paso 4-5). Va ligado al dispositivo y al `state` para
 * evitar CSRF en el retorno al callback.
 */
const authCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  deviceId: { type: String, required: true },
  serial: { type: String },
  callback: { type: String, required: true },
  state: { type: String },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

export interface IAuthCode extends mongoose.Document {
  code: string;
  deviceId: string;
  serial?: string;
  callback: string;
  state?: string;
  used: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export default mongoose.model<IAuthCode>("AuthCode", authCodeSchema);