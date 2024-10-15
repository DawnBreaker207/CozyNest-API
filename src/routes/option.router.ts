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
routeOption.get('/:product_id', getAllOption);
routeOption.get('/:product_id/:option_id', getOneOption);
routeOption.post('/:product_id', validBodyRequest(optionSchema), createOption);
routeOption.put(
  '/:product_id/:option_id',
  validBodyRequest(optionSchema),
  updateOption
);
routeOption.delete('/:product_id/:option_id', deleteOption);

export default routeOption;
