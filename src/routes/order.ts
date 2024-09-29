import {
  CreateOrder,
  GetAllOrders,
  UpdateOrder,
} from '@/controllers/order.controller';
import { Router } from 'express';

const routeOrder = Router();

routeOrder.get('/', GetAllOrders);
routeOrder.post('/', CreateOrder);
routeOrder.patch('/:id', UpdateOrder);

export default routeOrder;
