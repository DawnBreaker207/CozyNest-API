import { Router } from 'express';
import {
  Create,
  Delete,
  Get_All,
  Get_One,
  Update,
} from '../controllers/Category.controllers';

const routeCategory = Router();

routeCategory.get('/', Get_All);
routeCategory.get('/:id', Get_One);
routeCategory.post('/', Create);
routeCategory.put('/:id', Update);
routeCategory.delete('/:id', Delete);

export default routeCategory;
