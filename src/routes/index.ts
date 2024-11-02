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
import routeOption from './option.router';
import routeOptionalValue from './optionalValue.route';
import routeCoupon from './coupon.route';

const router = Router();

//* Products
router.use('/products', routeProduct);

//* Categories
router.use('/categories', routeCategory);

//* AuthenticationO
router.use('/auth', routeAuthentication);

//* Upload images
router.use('/upload', routeUpload);

//* Send mail
router.use('/mail', routeMail);

//* Users
router.use('/users', routeUser);

//* Orders
router.use('/orders', routeOrder);

//* Cart
router.use('/cart', routeCart);

//* Shipment
router.use('/shipment', routeShipment);

//* Payments
router.use('/payment', routePayment);

//* Option depend on products
router.use('/options', routeOption);

//* Optional value depend on products and options
router.use('/optionalValue', routeOptionalValue);

//* Variants depend on product,options and optional values
router.use('/variants', routeVariant);

//* Coupon
router.use('/coupon', routeCoupon);
export default router;
