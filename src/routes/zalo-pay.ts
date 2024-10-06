import { checkStatus, createZalo, handleCallback } from "@/controllers/zalo-pay";
import { Router } from "express";


const routerZalo = Router();

routerZalo.post('/create-zalo',createZalo);
routerZalo.get('/zalopay-ipn',checkStatus);
routerZalo.get('/zalopay-callback',handleCallback);

export default routerZalo;