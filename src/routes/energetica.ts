import express from "express";
import { createEnergeticaHandler } from "../controllers/energetica.js";

const router = express.Router();

router.post("/register", createEnergeticaHandler);

export default router;