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
//* Get all optional value in product
routeOptionalValue.get('/:product_id/:option_id', getAllOptionalValue);

//* Get one optional value in product
routeOptionalValue.get(
  '/:product_id/:option_id/:value_id',
  getOneOptionalValue
);

//* Create optional value depend option model
routeOptionalValue.post(
  '/:product_id/:option_id',
  validBodyRequest(optionalValuesSchema),
  createOptionalValue
);

//* Update option value depend option model
routeOptionalValue.put(
  '/:product_id/:option_id/:value_id',
  validBodyRequest(optionalValuesSchema),
  updateOptionalValue
);

//* Delete option value depend option model
routeOptionalValue.delete(
  '/:product_id/:option_id/:value_id',
  deleteOptionalValue
);

export default routeOptionalValue;
