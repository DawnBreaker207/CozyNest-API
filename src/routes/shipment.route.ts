import {
  calShippingFee,
  createDeliveryOrder,
  trackOrder,
} from '@/controllers/shipment.controller';
import { Router } from 'express';

const routeShipment = Router();

//* Create new order shipment
routeShipment.post('/create-order', createDeliveryOrder);

//* Calculate fee from order shipment
routeShipment.post('/calculate-fee', calShippingFee);

//* Track order shipment by order code id
routeShipment.get('/track-order/:orderCode', trackOrder);

export default routeShipment;
