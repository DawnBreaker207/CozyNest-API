import { Router } from 'express';
import validBodyRequest from '@/middlewares/validBodyRequest';
import {createOptionValue, deleteOptionValue, getAllOptionValue, getOneOptionValue, updateOptionValue } from '@/controllers/optionValues.controller';
import { optionValuesSchema } from '@/validations/optionValue.validation';

const routeOptionValue = Router();

// api option values 
routeOptionValue.get('/:product_id/:option_id', getAllOptionValue)
routeOptionValue.get('/:product_id/:option_id/:value_id', getOneOptionValue)
routeOptionValue.post('/:product_id/:option_id',validBodyRequest(optionValuesSchema), createOptionValue)
routeOptionValue.put('/:product_id/:option_id/:value_id', validBodyRequest(optionValuesSchema), updateOptionValue)
routeOptionValue.delete('/:product_id/:option_id/:value_id', deleteOptionValue)


export default routeOptionValue;