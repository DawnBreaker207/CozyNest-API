import { calculateShippingFee, createOrder, trackOrder } from "@/controllers/ghn.controller";
import { Router } from "express";


 const ghnRoute = Router();

ghnRoute.post('/calculate-fee', calculateShippingFee);
ghnRoute.post('/create-order', createOrder);
ghnRoute.get('/track-order/:orderCode', trackOrder);

export default ghnRoute;