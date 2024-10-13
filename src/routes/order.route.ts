import {
  CreateOrder,
  GetAllOrders,
  GetOneOrder,
  GetOrderByUserId,
  UpdateOrder,
} from '@/controllers/order.controller';
import { Router } from 'express';

const routeOrder = Router();

routeOrder.get('/', GetAllOrders);
routeOrder.get('/orderByOrderId/:id', GetOneOrder);
routeOrder.get('/orderByUserId', GetOrderByUserId);
routeOrder.post('/', CreateOrder);
routeOrder.patch('/updateOrder/:id', UpdateOrder);

export default routeOrder;
