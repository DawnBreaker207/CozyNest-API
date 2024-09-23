import { Router } from 'express';


import {
  Create_Product,
  Delete_Product,
  Get_All_Product,
  Get_One_Product,
  Hide_Product,
  Update_Product,
} from '../controllers/product.controller';
import validBodyRequest from '../middlewares/validBodyRequest';
import { productSchema } from '../validations/product.validation';
// import routeVariant from './variant.route';

const routeProduct = Router();


routeProduct.get('/', Get_All_Product);
routeProduct.get('/:id', Get_One_Product);
// routeProduct.use('/', routeVariant);

routeProduct.use(validBodyRequest(productSchema));
routeProduct.post('/', Create_Product);
routeProduct.put('/:id', Update_Product);


routeProduct.patch('/:id', Hide_Product);
routeProduct.delete('/:id', Delete_Product);

export default routeProduct;
