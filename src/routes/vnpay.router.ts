import { vnpayCreate, vnpayIpn, vnpayReturn } from "@/controllers/payment.controller";
import { Router } from "express";


const routeVnpay = Router();

routeVnpay.post('/create-vnpay',vnpayCreate);
routeVnpay.get('/vnpay-ipn',vnpayIpn);
routeVnpay.get('/vnpay-return',vnpayReturn);

export default routeVnpay;