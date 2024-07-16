import { Router } from 'express';
import {
  Create,
  Delete,
  Get_All,
  Get_One,
  Update,
} from '../controllers/Category.controllers';
import { checkAuth } from '../middlewares/checkAuth';
import { checkPermission } from '../middlewares/checkPermission';

const routeProduct = Router();

routeProduct.get('/', Get_All);
routeProduct.get('/:id', Get_One);

routeProduct.use(checkAuth, checkPermission(['manager', 'admin']));
routeProduct.post('/', Create);
routeProduct.put('/:id', Update);
routeProduct.use(checkAuth, checkPermission(['admin']));
routeProduct.delete('/:id', Delete);

export default routeProduct;
