import {Request, Response} from 'express';
import { createEnergetica } from "../services/energetica.js";
import { privateKey } from "../generateKeys.js";
import { blindSign } from "../blindSign.js";

export const createEnergeticaHandler = async (req: Request, res: Response) => {
    try {
        const encryptedC = BigInt(req.body.c);
        const decryptedC = privateKey.decrypt(encryptedC);
        const newEnergetica = await createEnergetica({ c: decryptedC });
        res.status(201).json(newEnergetica);
    } catch (error) {
        res.status(500).json({ message: 'Error creating energetica', error });
    }
};

export const blindSignHandler = async (req: Request, res: Response) => {
    try {
        const blinded = BigInt(req.body.blinded);
        const blindSig = blindSign(blinded);
        res.status(200).json({ blindSig: blindSig.toString() });
    } catch (error) {
        res.status(500).json({ message: 'Error signing blinded message', error });
    }
};