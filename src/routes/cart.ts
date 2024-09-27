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
routeCart.get('/:userId', GetById);
routeCart.post('/add-to-cart', AddToCart);
routeCart.post('/update-product-quantity', UpdateCart);
routeCart.post('/increase', increaseQuantity);
routeCart.post('/decrease', decreaseQuantity);
routeCart.delete('/:id', RemoveFromCart);
routeCart.delete('/remove-cart', RemoveCart);
export default routeCart;