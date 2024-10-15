import {
  Create_Product,
  Delete_Product,
  Get_All_Product,
  Get_One_Product,
  getRelatedProducts,
  Hide_Product,
  Update_Product,
} from '@/controllers/product.controller';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { productSchema } from '@/validations/product.validation';
import { Router } from 'express';
// import routeVariant from './variant.route';

const routeProduct = Router();

routeProduct.get('/', Get_All_Product);
routeProduct.get('/:id', Get_One_Product);
routeProduct.get('/:cate_id/:product_id', getRelatedProducts);
// routeProduct.use('/', routeVariant);
// routeProduct.use(checkAuth, checkPermission);

routeProduct.post('/', validBodyRequest(productSchema), Create_Product);
routeProduct.put('/:id', validBodyRequest(productSchema), Update_Product);

routeProduct.patch('/:id', Hide_Product);
routeProduct.delete('/:id', Delete_Product);

export default routeProduct;
