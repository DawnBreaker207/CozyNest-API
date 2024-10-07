
import { checkStatus, createMomo, createZalo, handleCallback, handleCallbackMomo, handleTransactionStatus, vnpayCreate, vnpayIpn, vnpayReturn } from "@/controllers/payment.controller";
import { Router } from "express";

const routePayment = Router();
//zalo-pay
routePayment.post('/create-zalo',createZalo);
routePayment.post('/zalopay-ipn/:id',checkStatus);
routePayment.post('/zalopay-callback',handleCallback);


//momo-pay
// 1. create momo
routePayment.post('/create-momo',createMomo )
// 2. callback
routePayment.post('/momo-callback',handleCallbackMomo )
// 3. trạng thái giao dịch
routePayment.get('/transaction-status',handleTransactionStatus )


//vnpay
routePayment.post('/create-vnpay',vnpayCreate);
routePayment.get('/vnpay-ipn', vnpayIpn);
routePayment.get('/vnpay-return',vnpayReturn);

export default routePayment;