import {
  createMomo,
  createVnPay,
  createZalo,
} from '@/controllers/payment.controller';
import {
  checkStatusMomo,
  checkStatusZaloPay,
  handleCallbackMomo,
  handleCallbackZaloPay,
  vnPayIpn,
  vnPayReturn,
} from '@/utils/payments';
import { Router } from 'express';

const routePayment = Router();
//* Zalo-pay
// 1. Create zalo-pay
routePayment.post('/create-zalo', createZalo);
// 2. Check transaction
routePayment.post('/zalopay-ipn/:id', checkStatusZaloPay);
// 3. callback
routePayment.post('/zalopay-callback', handleCallbackZaloPay);

//* MoMo-pay
// 1. Create momo
routePayment.post('/create-momo', createMomo);
// 2. Check transaction
routePayment.get('/transaction-status', checkStatusMomo);
// 3. callback
routePayment.post('/momo-callback', handleCallbackMomo);

//* VNPay
// 1. Create vnpay
routePayment.post('/create-vnpay', createVnPay);
// 2. Check transaction
routePayment.get('/vnpay-ipn', vnPayIpn);
// 3. Callback
routePayment.get('/vnpay-return', vnPayReturn);

export default routePayment;
