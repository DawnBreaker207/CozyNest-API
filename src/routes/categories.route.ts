import {
  Create_Category,
  Delete_Category,
  Get_All_Category,
  Get_One_Category,
  Hide_Category,
  Update_Category,
} from '@/controllers/category.controller';
import { checkAuth } from '@/middlewares/checkAuth';
import { checkPermission } from '@/middlewares/checkPermission';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { categorySchema } from '@/validations/product.validation';
import { Router } from 'express';

const routeCategory = Router();

routeCategory.get('/', Get_All_Category);
routeCategory.get('/:id', Get_One_Category);

// routeCategory.use(checkAuth, checkPermission);

routeCategory.patch('/:id', Hide_Category);
routeCategory.delete('/:id', Delete_Category);

routeCategory.post('/', validBodyRequest(categorySchema), Create_Category);
routeCategory.put('/:id', validBodyRequest(categorySchema), Update_Category);

export default routeCategory;
