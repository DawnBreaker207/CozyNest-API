import { Router } from 'express';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { variantSchema } from '@/validations/product.validation';
import { deleteVariant, getAllVariant, getOneVariant, saveVariant, updateVariant } from '@/controllers/variants.controller';

const routeVariant = Router();
// api variant
routeVariant.get("/:product_id/variants/:sku_id", getOneVariant)
routeVariant.get("/:product_id/variants", getAllVariant)
routeVariant.post("/:product_id/variants", validBodyRequest(variantSchema), saveVariant)
routeVariant.put("/:product_id/variants/:sku_id", validBodyRequest(variantSchema), updateVariant)
routeVariant.delete("/:product_id/variants/:sku_id", deleteVariant)

export default routeVariant;