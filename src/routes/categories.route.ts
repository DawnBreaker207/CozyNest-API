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

//* Get all categories
routeCategory.get('/', Get_All_Category);
//* Get one category
routeCategory.get('/:id', Get_One_Category);

// Check auth and permission
// routeCategory.use(checkAuth, checkPermission);

//* Create new category
routeCategory.post(
  '/',
  checkAuth,
  checkPermission,
  validBodyRequest(categorySchema),
  Create_Category
);

//* Update category
routeCategory.put(
  '/:id ',
  checkAuth,
  checkPermission,
  validBodyRequest(categorySchema),
  Update_Category
);

//* Soft delete category
routeCategory.patch('/:id', checkAuth, checkPermission, Hide_Category);
//* Hard delete category
routeCategory.delete('/:id', checkAuth, checkPermission, Delete_Category);

export default routeCategory;
