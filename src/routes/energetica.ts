import express from "express";
import {
  consentPageHandler,
  grantConsentHandler,
} from "../controllers/energetica.js";

const router = express.Router();

// Paso 2 — auth consent: el Device redirige aquí al User (registration request)
// y la Energética muestra la pantalla de consentimiento.
router.get("/register", consentPageHandler);

// Paso 2 → 3: el User concede el consentimiento; la Energética emite el
// auth_code y lo envía al Device a través de su callback.
router.post("/consent", grantConsentHandler);

export default router;