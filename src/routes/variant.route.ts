import { Router } from 'express';
import { Create_Variant } from '../controllers/variant.controllers';

const routeVariant = Router();
routeVariant.post('/:productId/variants', Create_Variant);
export default routeVariant;
