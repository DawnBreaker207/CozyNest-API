import { Router } from 'express';
import routeAuthentication from './authentication.route';
import routeCategory from './categories.route';
import routeMail from './mail';
import routeProduct from './products.route';
import routeUpload from './upload.route';
import routeUser from './user.route';
import routeOrder from './order';
import routeCart from './cart';
import routeVnpay from './vnpay.router';

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
router.use('/payment', routeVnpay);
// router.use('/size', routeSize);
// router.use('/color', routeColor);
export default router;
