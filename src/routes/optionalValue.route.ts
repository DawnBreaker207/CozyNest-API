import {
  createOptionalValue,
  deleteOptionalValue,
  getAllOptionalValue,
  getOneOptionalValue,
  updateOptionalValue,
} from '@/controllers/variants.controller';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { optionalValuesSchema } from '@/validations/variant.validation';
import { Router } from 'express';

const routeOptionalValue = Router();

// api option values
routeOptionalValue.get('/:product_id/:option_id', getAllOptionalValue);
routeOptionalValue.get(
  '/:product_id/:option_id/:value_id',
  getOneOptionalValue
);
routeOptionalValue.post(
  '/:product_id/:option_id',
  validBodyRequest(optionalValuesSchema),
  createOptionalValue
);
routeOptionalValue.put(
  '/:product_id/:option_id/:value_id',
  validBodyRequest(optionalValuesSchema),
  updateOptionalValue
);
routeOptionalValue.delete(
  '/:product_id/:option_id/:value_id',
  deleteOptionalValue
);

export default routeOptionalValue;
