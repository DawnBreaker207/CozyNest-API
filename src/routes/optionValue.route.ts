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
  '/:product_id/:option_id',
  // #swagger.tags = ['OptionalValue']
  getAllOptionValues,
);

//* Get one optional value in product
routeOptionValue.get(
  '/:product_id/:option_id/:value_id',
  // #swagger.tags = ['OptionalValue']
  getSingleOptionValue,
);

//* Create optional value depend option model
routeOptionValue.post(
  '/:product_id/:option_id',
  // checkAuth,
  // checkPermission,
  validBodyRequest(optionValuesSchema),
  // #swagger.tags = ['OptionalValue']
  createOptionValue,
);

//* Update option value depend option model
routeOptionValue.put(
  '/:product_id/:option_id/:value_id',
  // checkAuth,
  // checkPermission,
  validBodyRequest(optionValuesSchema),
  // #swagger.tags = ['OptionalValue']
  updateOptionValue,
);

//* Delete option value depend option model
routeOptionValue.delete(
  '/:product_id/:option_id/:value_id',
  // checkAuth,
  // checkPermission,
  // #swagger.tags = ['OptionalValue']
  deleteOptionValue,
);

export default routeOptionValue;
