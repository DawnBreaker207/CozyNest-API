import { Router } from 'express';
import routeAuth from './auth.route';
import routeCart from './cart.route';
import routeCategory from './categories.route';
import routeCoupon from './coupon.route';
import routeMail from './mail.route';
import routeOption from './option.route';
import routeOptionValue from './optionValue.route';
import routeOrder from './order.route';
import routePayment from './payment.route';
import routeProduct from './products.route';
import routeShipment from './shipment.route';
import routeUpload from './upload.route';
import routeUser from './user.route';
import routeArticle from './article.route';
import routeVariant from './variant.route';
import routeReview from './review.route';
import routeSearch from './search.route';
import routeStock from './stock.route';

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
router.use('/optionValue', routeOptionValue);

//* Variants depend on product,options and option values
router.use('/variants', routeVariant);

// Review
router.use('/review', routeReview);

//* Coupon
router.use('/coupon', routeCoupon);

//* Articles
router.use('/articles', routeArticle);

//* Search
router.use('/search', routeSearch);

//* Stock

router.use('/stock', routeStock);


export default router;
