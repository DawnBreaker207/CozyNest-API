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
routePayment.post(
  '/create-zalopay',
  // #swagger.tags = ['Payment']
  createZaloPay,
);
// 2. callback
routePayment.get(
  '/zalopay-callback',
  // #swagger.tags = ['Payment']
  zaloPayCallback,
);
// 3. Check transaction
routePayment.get(
  '/zalopay-ipn/:id',
  // #swagger.tags = ['Payment']
  zaloPayStatus,
);

//* MoMo-pay
// 1. Create momo
routePayment.post(
  '/create-momo',
  // #swagger.tags = ['Payment']
  createMomo,
);
// 2. callback
routePayment.get(
  '/momo-callback',
  // #swagger.tags = ['Payment']
  momoCallback,
);
// 3. Check transaction
routePayment.get(
  '/transaction-status',
  // #swagger.tags = ['Payment']
  momoStatus,
);

//* VNPay
// 1. Create vnpay
routePayment.post(
  '/create-vnpay',
  // #swagger.tags = ['Payment']
  createVnPay,
);
// 2. Callback
routePayment.get(
  '/vnpay-return',
  // #swagger.tags = ['Payment']
  vnPayCallback,
);
// 3. Check transaction
routePayment.get(
  '/vnpay-ipn',
  // #swagger.tags = ['Payment']
  vnPayStatus,
);

export default routePayment;
