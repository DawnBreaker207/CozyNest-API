import {
  AddToCart,
  decreaseQuantity,
  GetCartById,
  increaseQuantity,
  removeAllFromCart,
  RemoveCart,
  RemoveFromCart,
} from '@/controllers/cart.controller';
import { Router } from 'express';

const routeCart = Router();

//* Get cart user
routeCart.get(
  '/:userId',
  // checkAuth,
  // #swagger.tags = ['Cart']
  GetCartById,
);

//* Add product item to cart
routeCart.post(
  '/add-to-cart',
  // checkAuth,
  // #swagger.tags = ['Cart']
  AddToCart,
);

//* Increase product quantity in cart
routeCart.post(
  '/increase',
  // checkAuth,
  // #swagger.tags = ['Cart']
  increaseQuantity,
);

//* Decrease product quantity in cart
routeCart.post(
  '/decrease',
  // checkAuth,
  // #swagger.tags = ['Cart']
  decreaseQuantity,
);

//* Remove Allproduct from cart

routeCart.delete('/remove-allproducts-cart/:userId', removeAllFromCart);

//* Remove product from cart
routeCart.post(
  '/remove-from-cart',
  // checkAuth,
  // #swagger.tags = ['Cart']
  RemoveFromCart,
);

//* Delete entire cart when order done
routeCart.delete(
  '/remove-cart/:id',
  // #swagger.tags = ['Cart']
  RemoveCart,
);
export default routeCart;
