import { Router } from 'express';
import validBodyRequest from '@/middlewares/validBodyRequest';
import {createOptionValue, deleteOptionValue, getAllOptionValue, getOneOptionValue, updateOptionValue } from '@/controllers/optionValues.controller';
import { optionValuesSchema } from '@/validations/product.validation';

const routeOptionValue = Router();

// api option values 
routeOptionValue.get('/:product_id/options/:option_id/values', getAllOptionValue)
routeOptionValue.get('/:product_id/options/:option_id/values/:value_id', getOneOptionValue)
routeOptionValue.post('/:product_id/options/:option_id/values',validBodyRequest(optionValuesSchema), createOptionValue)
routeOptionValue.put('/:product_id/options/:option_id/values/:value_id', validBodyRequest(optionValuesSchema), updateOptionValue)
routeOptionValue.delete('/:product_id/options/:option_id/values/:value_id', deleteOptionValue)


export default routeOptionValue;