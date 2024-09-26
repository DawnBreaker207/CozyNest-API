import { Router } from 'express';
import validBodyRequest from '../middlewares/validBodyRequest';
import { categorySchema } from '../validations/product.validation';
import {
  Create_Category,
  Delete_Category,
  Get_All_Category,
  Get_One_Category,
  Hide_Category,
  Update_Category,
} from '../controllers/category.controller';

const routeCategory = Router();

routeCategory.get('/', Get_All_Category);
routeCategory.get('/:id', Get_One_Category);

routeCategory.use(validBodyRequest(categorySchema));
routeCategory.post('/', Create_Category);
routeCategory.put('/:id', Update_Category);

routeCategory.patch('/:id', Hide_Category);
routeCategory.delete('/:id', Delete_Category);

export default routeCategory;
