import {
  createOptionValue,
  deleteOptionValue,
  getAllOptionValues,
  getSingleOptionValue,
  updateOptionValue,
} from '@/controllers/variants.controller';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { optionValuesSchema } from '@/validations/variant.validation';
import { Router } from 'express';

const routeOptionValue = Router();

// Api option values
//* Get all optional value in product
routeOptionValue.get(
  '/:product_id/options/:option_id/values',
  // #swagger.tags = ['OptionalValue']
  getAllOptionValues,
);

//* Get one optional value in product
routeOptionValue.get(
  '/:product_id/options/:option_id/:value_id/values',
  // #swagger.tags = ['OptionalValue']
  getSingleOptionValue,
);

//* Create optional value depend option model
routeOptionValue.post(
  '/:product_id/options/:option_id/values',
  // [ checkAuth,
  // checkPermission,]
  validBodyRequest(optionValuesSchema),
  // #swagger.tags = ['OptionalValue']
  createOptionValue,
);

//* Update option value depend option model
routeOptionValue.put(
  '/:product_id/options/:option_id/:value_id/values',
  // [ checkAuth,
  // checkPermission,]
  validBodyRequest(optionValuesSchema),
  // #swagger.tags = ['OptionalValue']
  updateOptionValue,
);

//* Delete option value depend option model
routeOptionValue.delete(
  '/:product_id/options/:option_id/:value_id/value',
  // [ checkAuth,
  // checkPermission,]
  // #swagger.tags = ['OptionalValue']
  deleteOptionValue,
);

export default routeOptionValue;
