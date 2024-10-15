import { Router } from 'express';
import routeAuthentication from './authentication.route';
import routeCart from './cart.route';
import routeCategory from './categories.route';
import routeMail from './mail.route';
import routeOrder from './order.route';
import routePayment from './payment.route';
import routeProduct from './products.route';
import routeShipment from './shipment.route';
import routeUpload from './upload.route';
import routeUser from './user.route';
import routeVariant from './variant.router';

// import routeColor from './color.route';
// import routeSize from './size.route';

const router = Router();
router.use('/products', routeProduct);
router.use('/categories', routeCategory);
router.use('/auth', routeAuthentication);
router.use('/upload', routeUpload);
router.use('/mail', routeMail);
router.use('/users', routeUser);
router.use('/orders', routeOrder);
router.use('/cart', routeCart);
router.use('/shipment', routeShipment);
router.use('/payment', routePayment);
router.use('/variants', routeVariant);

// router.use('/size', routeSize);
// router.use('/color', routeColor);
export default router;
