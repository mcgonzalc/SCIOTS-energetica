import express from "express";
import dotenv from "dotenv";
import energeticaRoutes from "./routes/energetica.js";
import { publicKey,privateKey, publicKeyJson, privateKeyJson } from "./generateKeys.js";

dotenv.config({ quiet: true });

const app = express();
const port = 3000;

app.use(express.json());

 const publicKeyString = JSON.stringify(publicKeyJson);

// Rutas Rest
app.use("/", energeticaRoutes);

app.get("/pubKey", (_req,res) => {
  res.send({ publicKey: publicKeyString });
});
//Rutas de prueba

app.get("/", (_req,res) => {
  res.send(("welcome to the PD G3 Backend!"));
})
app.post("/", (_req,res) => {
  res.send(("good post to the PD G3 Backend!"));
})

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});