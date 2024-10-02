import {
  vnpayCreate,
  vnpayIpn,
  vnpayReturn,
} from '@/controllers/payment.controller';
import { Router } from 'express';
const routeVNPay = Router();

// "vnp_TmnCode":"",
// "vnp_HashSecret":"",
// "vnp_Url":"https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
// "vnp_Api":"https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
// "vnp_ReturnUrl": "http://localhost:8888/order/vnpay_return"

routeVNPay.post('/create-vnpay', vnpayCreate);
routeVNPay.get('/vnpay-ipn', vnpayIpn);
routeVNPay.get('/vnpay-return', vnpayReturn);

export default routeVNPay;
