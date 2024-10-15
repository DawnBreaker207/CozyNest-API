import {
  calShippingFee,
  createOrder,
  trackOrder,
} from '@/controllers/shipment.controller';
import { Router } from 'express';

const routeShipment = Router();

routeShipment.post('/create-order', createOrder);
routeShipment.post('/calculate-fee', calShippingFee);
routeShipment.get('/track-order/:orderCode', trackOrder);

export default routeShipment;
