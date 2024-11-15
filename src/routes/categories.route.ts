import {
  createCategory,
  getAllCategories,
  getOneCategory,
  hardDeleteCategory,
  softDeleteCategory,
  updateCategory,
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
  getAllCategories,
);
//* Get one category
routeCategory.get(
  '/:id',
  // #swagger.tags = ['Category']
  getOneCategory,
);

// Check auth and permission
// RouteCategory.use(checkAuth, checkPermission);

//* Create new category
routeCategory.post(
  '/',
  checkAuth,
  checkPermission,
  validBodyRequest(categorySchema),
  // #swagger.tags = ['Category']
  createCategory,
);

//* Update category
routeCategory.put(
  '/:id',
  checkAuth,
  checkPermission,
  validBodyRequest(categorySchema),
  // #swagger.tags = ['Category']
  updateCategory,
);

//* Soft delete category
routeCategory.patch(
  '/:id',
  checkAuth,
  checkPermission,
  // #swagger.tags = ['Category']
  softDeleteCategory,
);

//* Hard delete category
routeCategory.delete(
  '/:id',
  checkAuth,
  checkPermission,
  // #swagger.tags = ['Category']
  hardDeleteCategory,
);

export default routeCategory;
