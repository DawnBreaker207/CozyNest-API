import { checkStockBeforePayment } from '@/controllers/stock.controller';
import { Router } from 'express';

const routeStock = Router();

//* Create new order shipment
routeStock.post(
  '/checkStock',
  // #swagger.tags = ['Shipment']
  checkStockBeforePayment,
);

export default routeStock;
