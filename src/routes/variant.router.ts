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
routeVariant.get('/:product_id/:sku_id', getOneVariant);
routeVariant.get('/:product_id', getAllVariant);
routeVariant.post('/:product_id', validBodyRequest(variantSchema), saveVariant);
routeVariant.put(
  '/:product_id/:sku_id',
  validBodyRequest(variantSchema),
  updateVariant
);
routeVariant.delete('/:product_id/:sku_id', deleteVariant);

export default routeVariant;
