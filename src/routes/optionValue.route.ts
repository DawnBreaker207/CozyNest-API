import {
  createOptionValue,
  deleteOptionValue,
  getAllOptionValues,
  getSingleOptionValue,
  updateOptionValue,
} from '@/controllers/variants.controller';
import { checkAuth } from '@/middlewares/checkAuth';
import { checkPermission } from '@/middlewares/checkPermission';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { optionValuesSchema } from '@/validations/variant.validation';
import { Router } from 'express';

const routeOptionValue = Router();

// Api option values
//* Get all option value in product
routeOptionValue.get(
  '/:product_id/options/:option_id/values',
  // #swagger.tags = ['OptionValue']
  getAllOptionValues,
);

//* Get one option value in product
routeOptionValue.get(
  '/:product_id/options/:option_id/:value_id/values',
  // #swagger.tags = ['OptionValue']
  getSingleOptionValue,
);

//* Create option value depend option model
routeOptionValue.post(
  '/:product_id/options/:option_id/values',
  [checkAuth, checkPermission],
  validBodyRequest(optionValuesSchema),
  // #swagger.tags = ['OptionValue']
  createOptionValue,
);

//* Update option value depend option model
routeOptionValue.put(
  '/:product_id/options/:option_id/values/:value_id',
  [checkAuth, checkPermission],
  validBodyRequest(optionValuesSchema),
  // #swagger.tags = ['OptionValue']
  updateOptionValue,
);

//* Delete option value depend option model
routeOptionValue.delete(
  '/:product_id/options/:option_id/:value_id/values',
  [checkAuth, checkPermission],
  // #swagger.tags = ['OptionValue']
  deleteOptionValue,
);

export default routeOptionValue;
