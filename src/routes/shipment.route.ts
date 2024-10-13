import {
  calShippingFee,
  createOrder,
  trackOrder,
} from '@/controllers/shipment.controller';
import { Router } from 'express';

const routeShipment = Router();

routeShipment.post('/calculate-fee', calShippingFee);
routeShipment.post('/create-order', createOrder);
routeShipment.get('/track-order/:orderCode', trackOrder);

export default routeShipment;
