import { Router } from "express";
import { handleCallback, handleTransaction, handleTransactionStatus } from "../controllers/momo-pay";

const momoRouter = Router();

momoRouter.post('/momo' ,handleTransaction)
momoRouter.post('/callback' ,handleCallback)
momoRouter.post('/transaction-status' ,handleTransactionStatus)

export default momoRouter