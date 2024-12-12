import {
  createProduct,
  getAllProducts,
  getOneProduct,
  getRelatedProducts,
  hardDeleteProduct,
  softDeleteProduct,
  updateProduct,
} from '@/controllers/product.controller';
import { checkAuth } from '@/middlewares/checkAuth';
import { checkPermission } from '@/middlewares/checkPermission';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { productSchema } from '@/validations/product.validation';
import { Router } from 'express';

const routeProduct = Router();

//* Get all products exist
routeProduct.get(
  '/',
  // #swagger.tags = ['Product']
  getAllProducts,
);

//* Get one product
routeProduct.get(
  '/:id',
  // #swagger.tags = ['Product']
  getOneProduct,
);

//* Get relate product by category id
routeProduct.get(
  '/:cate_id/:product_id',
  // #swagger.tags = ['Product']
  getRelatedProducts,
);

// RouteProduct.use(checkAuth, checkPermission);

//* Create new product
routeProduct.post(
  '/',
  [checkAuth, checkPermission],
  validBodyRequest(productSchema),
  // #swagger.tags = ['Product']
  createProduct,
);

//* Update product
routeProduct.put(
  '/:id',
  [checkAuth, checkPermission],
  validBodyRequest(productSchema),
  // #swagger.tags = ['Product']
  updateProduct,
);

//* Soft delete product
routeProduct.patch(
  '/:id',
  [checkAuth, checkPermission],
  // #swagger.tags = ['Product']
  softDeleteProduct,
);

//* Hard delete product
routeProduct.delete(
  '/:id',
  [checkAuth, checkPermission],
  // #swagger.tags = ['Product']
  hardDeleteProduct,
);

export default routeProduct;
