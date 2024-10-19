import {
  deleteVariant,
  getAllVariant,
  getOneVariant,
  saveVariant,
  updateVariant,
} from '@/controllers/variants.controller';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { variantSchema } from '@/validations/variant.validation';
import { Router } from 'express';

const routeVariant = Router();

// Variant Route
//* Get all variants exist
routeVariant.get('/:product_id', getAllVariant);

//* Get one variant
routeVariant.get('/:product_id/:sku_id', getOneVariant);

//* Create variant
routeVariant.post('/:product_id', validBodyRequest(variantSchema), saveVariant);

//* Update variant
routeVariant.put(
  '/:product_id/:sku_id',
  validBodyRequest(variantSchema),
  updateVariant
);

//* Delete variant
routeVariant.delete('/:product_id/:sku_id', deleteVariant);

export default routeVariant;
