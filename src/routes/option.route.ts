import {
  createOption,
  deleteOption,
  getAllOptions,
  getOneOption,
  updateOption,
} from '@/controllers/variants.controller';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { optionSchema } from '@/validations/variant.validation';
import { Router } from 'express';

const routeOption = Router();

// Api option

//* Get all option value in product
routeOption.get(
  '/:product_id/options',
  // #swagger.tags = ['Option']
  getAllOptions,
);

//* Get one option value in product
routeOption.get(
  '/:product_id/options/:option_id',
  // #swagger.tags = ['Option']
  getOneOption,
);

//* Create option value in product
routeOption.post(
  '/:product_id/options',
  // checkAuth,
  // checkPermission,
  validBodyRequest(optionSchema),
  // #swagger.tags = ['Option']
  createOption,
);

//* Update option value in product
routeOption.put(
  '/:product_id/options/:option_id',
  // checkAuth,
  // checkPermission,
  validBodyRequest(optionSchema),
  // #swagger.tags = ['Option']
  updateOption,
);

//* Delete option value in product
routeOption.delete(
  '/:product_id/options/:option_id',
  // checkAuth,
  // checkPermission,
  // #swagger.tags = ['Option']
  deleteOption,
);

export default routeOption;
