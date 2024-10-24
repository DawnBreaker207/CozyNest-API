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
import { checkAuth } from '../middlewares/checkAuth';
import { checkPermission } from '@/middlewares/checkPermission';

const routeProduct = Router();

//* Get all products exist
routeProduct.get('/', Get_All_Product);

//* Get one product
routeProduct.get('/:id', Get_One_Product);

//* Get relate product by category id
routeProduct.get('/:cate_id/:product_id', getRelatedProducts);

// routeProduct.use(checkAuth, checkPermission);

//* Create new product
routeProduct.post(
  '/',
  checkAuth,
  checkPermission,
  validBodyRequest(productSchema),
  Create_Product
);

//* Update product
routeProduct.put(
  '/:id',
  checkAuth,
  checkPermission,
  validBodyRequest(productSchema),
  Update_Product
);

//* Soft delete product
routeProduct.patch('/:id', checkAuth, checkPermission, Hide_Product);

//* Hard delete product
routeProduct.delete('/:id', checkAuth, checkPermission, Delete_Product);

export default routeProduct;
