import {
  vnpayCreate,
  vnpayIpn,
  vnpayReturn,
} from '@/controllers/payment.controller';
import { Router } from 'express';
const routeVNPay = Router();

routeVNPay.post('/create-vnpay', vnpayCreate);
routeVNPay.get('/vnpay-ipn', vnpayIpn);
routeVNPay.get('/vnpay-return', vnpayReturn);

export default routeVNPay;

