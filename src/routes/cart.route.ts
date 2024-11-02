import {
  AddToCart,
  decreaseQuantity,
  GetById,
  increaseQuantity,
  RemoveCart,
  RemoveFromCart,
} from '@/controllers/cart.controller';
import { checkAuth } from '@/middlewares/checkAuth';
import { Router } from 'express';

const routeCart = Router();

//* Get cart user
routeCart.get('/:userId', checkAuth, GetById);

//* Add product item to cart
routeCart.post('/add-to-cart', checkAuth, AddToCart);

//* Increase product quantity in cart
routeCart.post('/increase', checkAuth, increaseQuantity);

//* Decrease product quantity in cart
routeCart.post('/decrease', checkAuth, decreaseQuantity);

//* Remove product from cart
routeCart.post('/remove-from-cart', checkAuth, RemoveFromCart);

//* Delete entire cart when order done
routeCart.delete('/remove-cart/:id', RemoveCart);
export default routeCart;
