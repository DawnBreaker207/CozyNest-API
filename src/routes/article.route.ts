import {
  createArticle,
  deleteArticle,
  getAll,
  getArticleDetail,
  updateArticle,
} from '@/controllers/article.controller';
import { checkAuth } from '@/middlewares/checkAuth';
import { checkPermission } from '@/middlewares/checkPermission';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { articleSchema } from '@/validations/article.validation';
import { Router } from 'express';

const routeArticle = Router();
//*get all
routeArticle.get('/', getAll);

//*get one
routeArticle.get('/:id', getArticleDetail);

//*create
routeArticle.post(
  '/',
  createArticle,
  validBodyRequest(articleSchema),
  checkAuth,
  checkPermission,
);

//*update
routeArticle.put(
  '/:id',
  updateArticle,
  validBodyRequest(articleSchema),
  checkAuth,
  checkPermission,
);

//*delete
routeArticle.delete('/:id', deleteArticle, checkAuth, checkPermission);

export default routeArticle;
