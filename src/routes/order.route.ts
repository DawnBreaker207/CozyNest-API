import {
  CreateOrder,
  GetAllOrders,
  GetOrder,
  UpdateOrder,
} from '@/controllers/order.controller';
import { Router } from 'express';

const routeOrder = Router();

routeOrder.get('/', GetAllOrders);
routeOrder.get('/:id', GetOrder);
routeOrder.post('/', CreateOrder);
routeOrder.patch('/:id', UpdateOrder);

export default routeOrder;
