import mongoose from "mongoose";

const energeticaSchema = new mongoose.Schema({
  c: { type: BigInt, required: true },
});

export interface IEnergetica extends mongoose.Document {
  c: bigint;
}

export default mongoose.model("Energetica", energeticaSchema);