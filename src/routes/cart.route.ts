import {
  AddToCart,
  decreaseQuantity,
  GetById,
  increaseQuantity,
  removeAllFromCart,
  RemoveCart,
  RemoveFromCart,
} from '@/controllers/cart.controller';
import { checkAuth } from '@/middlewares/checkAuth';
import { Router } from 'express';

const routeCart = Router();

//* Get cart user
routeCart.get(
  '/:userId',
  checkAuth,
  // #swagger.tags = ['Cart']
  GetById,
);

//* Add product item to cart
routeCart.post(
  '/add-to-cart',
  checkAuth,
  // #swagger.tags = ['Cart']
  AddToCart,
);

//* Increase product quantity in cart
routeCart.post(
  '/increase',
  checkAuth,
  // #swagger.tags = ['Cart']
  increaseQuantity,
);

//* Decrease product quantity in cart
routeCart.post(
  '/decrease',
  checkAuth,
  // #swagger.tags = ['Cart']
  decreaseQuantity,
);

//* Remove product from cart
routeCart.post(
  '/remove-from-cart',
  checkAuth,
  // #swagger.tags = ['Cart']
  RemoveFromCart,
);

// route xóa tất cả sản phẩm
routeCart.delete('/remove-all/:userId', removeAllFromCart);

//* Delete entire cart when order done
routeCart.delete(
  '/remove-cart/:id',
  // #swagger.tags = ['Cart']
  RemoveCart,
);
export default routeCart;
