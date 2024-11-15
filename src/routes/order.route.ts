import {
  cancelOrder,
  confirmReturnedOrder,
  createNewOrder,
  decreaseProductFromOrder,
  getAllOrders,
  getAllShipping,
  getAllUserOrders,
  getOneOrder,
  getOrderByPhoneNumber,
  getOrderByUserId,
  getReturnedOrder,
  increaseProductFromOrder,
  removeProductFromOrder,
  returnedOrder,
  serviceCalFee,
  updateInfoCustomer,
  updatePaymentStatus,
  updateStatusDelivered,
  updateStatusOrder,
} from '@/controllers/order.controller';
import { Router } from 'express';


const routeOrder = Router();
routeOrder.put('/decrement', decreaseProductFromOrder);
routeOrder.put('/increment', increaseProductFromOrder);
routeOrder.put('/decrement-product-order', removeProductFromOrder);
routeOrder.post('/payment-status', updatePaymentStatus);
routeOrder.post('/calculateFee', serviceCalFee);
routeOrder.put('/orderByPhoneNumber', getOrderByPhoneNumber);
//* Get order by user id
routeOrder.get('/orderByUserId', getOrderByUserId);
routeOrder.post('/return', returnedOrder);
routeOrder.get('/return', getReturnedOrder);
routeOrder.put('/return/:id', confirmReturnedOrder);
routeOrder.put('/confirm-completed/:id', updateStatusDelivered);
//* Create new order
routeOrder.post('/', createNewOrder);
routeOrder.get('/', getAllOrders);
//* Get all orders exist
routeOrder.get('/statistical', getAllUserOrders);
routeOrder.get('/shipping', getAllShipping);
//* Get order by order id
routeOrder.get('/:id', getOneOrder);
routeOrder.delete('/cancel/:id', cancelOrder);
//* Update order status
routeOrder.put('/updateStatus/:id', updateStatusOrder);
routeOrder.put('/updateInfoCustomer/:id', updateInfoCustomer);

export default routeOrder;
