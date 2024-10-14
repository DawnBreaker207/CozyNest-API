import { Router } from 'express';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { deleteVariant, getAllVariant, getOneVariant, saveVariant, updateVariant } from '@/controllers/variants.controller';
import { variantSchema } from '@/validations/variant.validation';

const routeVariant = Router();
// api variant
routeVariant.get("/:product_id/:sku_id", getOneVariant)
routeVariant.get("/:product_id", getAllVariant)
routeVariant.post("/:product_id", validBodyRequest(variantSchema), saveVariant)
routeVariant.put("/:product_id/:sku_id", validBodyRequest(variantSchema), updateVariant)
routeVariant.delete("/:product_id/:sku_id", deleteVariant)

export default routeVariant;