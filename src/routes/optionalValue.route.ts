import {
  createOptionalValue,
  deleteOptionalValue,
  getAllOptionalValue,
  getSingleOptionalValue,
  updateOptionalValue,
} from '@/controllers/variants.controller';
import { checkAuth } from '@/middlewares/checkAuth';
import { checkPermission } from '@/middlewares/checkPermission';
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
  getSingleOptionalValue,
);

//* Create optional value depend option model
routeOptionalValue.post(
  '/:product_id/:option_id',
  checkAuth,
  checkPermission,
  validBodyRequest(optionalValuesSchema),
  createOptionalValue,
);

//* Update option value depend option model
routeOptionalValue.put(
  '/:product_id/:option_id/:value_id',
  checkAuth,
  checkPermission,
  validBodyRequest(optionalValuesSchema),
  updateOptionalValue,
);

//* Delete option value depend option model
routeOptionalValue.delete(
  '/:product_id/:option_id/:value_id',
  checkAuth,
  checkPermission,
  deleteOptionalValue,
);

export default routeOptionalValue;
