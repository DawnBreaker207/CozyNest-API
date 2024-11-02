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
routeCategory.get(
  '/',
  // #swagger.tags = ['Category']
  Get_All_Category,
);
//* Get one category
routeCategory.get(
  '/:id',
  // #swagger.tags = ['Category']
  Get_One_Category,
);

// Check auth and permission
// routeCategory.use(checkAuth, checkPermission);

//* Create new category
routeCategory.post(
  '/',
  checkAuth,
  checkPermission,
  validBodyRequest(categorySchema),
  // #swagger.tags = ['Category']
  Create_Category,
);

//* Update category
routeCategory.put(
  '/:id ',
  checkAuth,
  checkPermission,
  validBodyRequest(categorySchema),
  // #swagger.tags = ['Category']
  Update_Category,
);

//* Soft delete category
routeCategory.patch(
  '/:id',
  checkAuth,
  checkPermission,
  // #swagger.tags = ['Category']
  Hide_Category,
);
//* Hard delete category
routeCategory.delete(
  '/:id',
  checkAuth,
  checkPermission,
  // #swagger.tags = ['Category']
  Delete_Category,
);

export default routeCategory;
