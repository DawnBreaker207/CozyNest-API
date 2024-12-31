import {
  calShippingFee,
  createDeliveryOrder,
  trackOrder,
} from '@/controllers/shipment.controller';
import { Router } from 'express';

const routeShipment = Router();

//* Create new order shipment
routeShipment.post(
  '/create-order',
  // #swagger.tags = ['Shipment']
  createDeliveryOrder,
);

//* Calculate fee from order shipment
routeShipment.post(
  '/calculate-fee',
  // #swagger.tags = ['Shipment']
  calShippingFee,
);

//* Track order shipment by order code id
routeShipment.get(
  '/track-order/:orderCode',
  // #swagger.tags = ['Shipment']
  trackOrder,
);

export default routeShipment;
