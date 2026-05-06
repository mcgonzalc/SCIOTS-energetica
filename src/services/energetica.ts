import Energetica from "../models/energetica.js";

export const createEnergetica = async(energeticaData: { c: bigint }) => {
    const energetica = new Energetica(energeticaData);
    return await energetica.save();
};