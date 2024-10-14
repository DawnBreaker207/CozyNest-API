import { Router } from 'express';
import { createOption, deleteOption, getAllOption, getOneOption, updateOption } from '@/controllers/option.controller';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { optionSchema } from '@/validations/option.validation';

const routeOption = Router();

// api option
routeOption.get("/:product_id", getAllOption)
routeOption.get("/:product_id/:option_id", getOneOption)
routeOption.post("/:product_id", validBodyRequest(optionSchema), createOption)
routeOption.put("/:product_id/:option_id", validBodyRequest(optionSchema), updateOption)
routeOption.delete("/:product_id/:option_id", deleteOption)

export default routeOption;