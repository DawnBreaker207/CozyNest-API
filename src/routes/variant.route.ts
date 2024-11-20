import {
  createVariant,
  deleteVariant,
  getAllVariants,
  getOneVariant,
  updateVariant,
} from '@/controllers/variants.controller';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { variantSchema } from '@/validations/variant.validation';
import { Router } from 'express';

const routeVariant = Router();

// Variant Route
//* Get all variants exist
routeVariant.get(
  '/:product_id',
  // #swagger.tags = ['Variant']
  getAllVariants,
);

//* Get one variant
routeVariant.get(
  '/:product_id/:sku_id',
  // #swagger.tags = ['Variant']
  getOneVariant,
);

//* Create variant
routeVariant.post(
  '/:product_id',
  // checkAuth,
  // checkPermission,
  validBodyRequest(variantSchema),
  // #swagger.tags = ['Variant']
  createVariant,
);

//* Update variant
routeVariant.put(
  '/:product_id/:sku_id',
  // checkAuth,
  // checkPermission,
  validBodyRequest(variantSchema),
  // #swagger.tags = ['Variant']
  updateVariant,
);

//* Delete variant
routeVariant.delete(
  '/:product_id/:sku_id',
  // checkAuth,
  // checkPermission,
  // #swagger.tags = ['Variant']
  deleteVariant,
);

export default routeVariant;
