import {
  CreateOrder,
  GetAllOrders,
  GetOneOrder,
  GetOrderByUserId,
  UpdateOrder,
} from '@/controllers/order.controller';
import { Router } from 'express';

const routeOrder = Router();
//* Get all orders exist
routeOrder.get('/', GetAllOrders);

//* Get order by order id
routeOrder.get('/orderByOrderId/:id', GetOneOrder);

//* Get order by user id
routeOrder.get('/orderByUserId', GetOrderByUserId);

//* Create new order
routeOrder.post('/', CreateOrder);

//* Update order status
routeOrder.patch('/updateOrder/:id', UpdateOrder);

export default routeOrder;
