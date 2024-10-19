import {
  createOption,
  deleteOption,
  getAllOption,
  getOneOption,
  updateOption,
} from '@/controllers/variants.controller';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { optionSchema } from '@/validations/variant.validation';
import { Router } from 'express';

const routeOption = Router();

// api option

//* Get all option value in product
routeOption.get('/:product_id', getAllOption);

//* Get one option value in product
routeOption.get('/:product_id/:option_id', getOneOption);

//* Create option value in product
routeOption.post('/:product_id', validBodyRequest(optionSchema), createOption);

//* Update option value in product
routeOption.put(
  '/:product_id/:option_id',
  validBodyRequest(optionSchema),
  updateOption
);

//* Delete option value in product
routeOption.delete('/:product_id/:option_id', deleteOption);

export default routeOption;
