import express from "express";
import { createEnergeticaHandler, blindSignHandler } from "../controllers/energetica.js";

const router = express.Router();

router.post("/data", createEnergeticaHandler);
router.post("/blindsign", blindSignHandler);

export default router;