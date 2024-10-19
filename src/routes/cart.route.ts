import {
  AddToCart,
  decreaseQuantity,
  GetById,
  increaseQuantity,
  RemoveCart,
  RemoveFromCart,
  UpdateCart,
} from '@/controllers/cart.controller';
import { Router } from 'express';

const routeCart = Router();

//* Get cart user
routeCart.get('/:userId', GetById);

//* Add product item to cart
routeCart.post('/add-to-cart', AddToCart);

//* Update product quantity in cart
routeCart.put('/update-product-quantity', UpdateCart);

//* Increase product quantity in cart
routeCart.post('/increase', increaseQuantity);

//* Decrease product quantity in cart
routeCart.post('/decrease', decreaseQuantity);

//* Remove product from cart
routeCart.post('/remove-from-cart', RemoveFromCart);

//* Delete entire cart when order done
routeCart.delete('/remove-cart/:id', RemoveCart);
export default routeCart;
