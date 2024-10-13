import {
  CreateOrder,
  GetAllOrders,
  GetOneOrder,
  GetOrderByUserId,
  UpdateOrder,
} from '@/controllers/order.controller';
import { Router } from 'express';

const routeOrder = Router();

routeOrder.get('/getAllOrders', GetAllOrders);
routeOrder.get('/orderByOrderId/:id', GetOneOrder);
routeOrder.get('/orderByUserId', GetOrderByUserId);
routeOrder.post('/createOrder', CreateOrder);
routeOrder.patch('/updateOrder/:id', UpdateOrder);

export default routeOrder;
