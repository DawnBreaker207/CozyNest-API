import { Router } from "express";
import routeProduct from "./products.route";
import routeCategory from "./categories.route";
import routeAuth from "./auth.route";
import routeUpload from "./upload.route";
import routeCart from "./cart.route";
import routeShipment from "./shipment.route";
import routePayment from "./payment.route";
import routeOption from "./option.route";
import routeOptionalValue from "./optionalValue.route";
import routeVariant from "./variant.route";
import routeCoupon from "./coupon.route";

const router = Router();

//* Products
router.use('/products', routeProduct);

//* Categories
router.use('/categories', routeCategory);

//* Authentication
router.use('/auth', routeAuth);

//* Upload images
router.use('/upload', routeUpload);

//* Send mail
// router.use('/mail', routeMail);

//* Users
// router.use('/users', routeUser);

//* Orders
// router.use('/orders', routeOrder);

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
