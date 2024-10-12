import {
  createMomo,
  createVnPay,
  createZaloPay,
  momoCallback,
  momoStatus,
  vnPayCallback,
  vnPayStatus,
  zaloPayCallback,
  zaloPayStatus,
} from '@/controllers/payment.controller';

import { Router } from 'express';

const routePayment = Router();

//* Zalo-pay
// 1. Create zalo-pay
routePayment.post('/create-zalopay', createZaloPay);
// 2. callback
routePayment.post('/zalopay-callback', zaloPayCallback);
// 3. Check transaction
routePayment.post('/zalopay-ipn/:id', zaloPayStatus);

//* MoMo-pay
// 1. Create momo
routePayment.post('/create-momo', createMomo);
// 2. callback
routePayment.post('/momo-callback', momoCallback);
// 3. Check transaction
routePayment.get('/transaction-status', momoStatus);

//* VNPay
// 1. Create vnpay
routePayment.post('/create-vnpay', createVnPay);
// 2. Callback
routePayment.get('/vnpay-return', vnPayCallback);
// 3. Check transaction
routePayment.get('/vnpay-ipn', vnPayStatus);

export default routePayment;
