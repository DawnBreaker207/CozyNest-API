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
routeCart.put('/update-product-quantity', UpdateCart);
routeCart.post('/increase', increaseQuantity);
routeCart.post('/decrease', decreaseQuantity);
routeCart.post('/remove-from-cart', RemoveFromCart);
routeCart.delete('/remove-cart/:id', RemoveCart);
export default routeCart;
