import {
  CreateOrder,
  GetAllOrders,
  GetOneOrder,
  GetOrderByUserId,
  UpdateOrder,
} from '@/controllers/order.controller';
import { checkAuth } from '@/middlewares/checkAuth';
import { checkPermission } from '@/middlewares/checkPermission';
import { Router } from 'express';

const routeOrder = Router();
//* Get all orders exist
routeOrder.get('/', checkAuth, checkPermission, GetAllOrders);

//* Get order by order id
routeOrder.get('/orderByOrderId/:id', GetOneOrder);

//* Get order by user id
routeOrder.get('/orderByUserId', GetOrderByUserId);

//* Create new order
routeOrder.post('/', CreateOrder);

//* Update order status
routeOrder.patch('/updateOrder/:id', checkAuth, checkPermission, UpdateOrder);

export default routeOrder;
