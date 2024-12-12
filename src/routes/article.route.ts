import {
  createArticle,
  deleteArticle,
  getAll,
  getArticleDetail,
  updateArticle,
} from '@/controllers/article.controller';
import { checkAuth } from '@/middlewares/checkAuth';
import { checkPermission } from '@/middlewares/checkPermission';
import { Router } from 'express';

const routeArticle = Router();
//*get all
routeArticle.get(
  '/',
  // #swagger.tags = ['Articles']
  getAll,
);

//*get one
routeArticle.get(
  '/:id',
  // #swagger.tags = ['Articles']
  getArticleDetail,
);

//*create
routeArticle.post(
  '/',
  [checkAuth, checkPermission],
  // validBodyRequest(articleSchema),
  // #swagger.tags = ['Articles']
  createArticle,
);

//*update
routeArticle.put(
  '/:id',
  [checkAuth, checkPermission],
  // validBodyRequest(articleSchema),
  // #swagger.tags = ['Articles']
  updateArticle,
);

//*delete
routeArticle.delete(
  '/:id',
  [checkAuth, checkPermission],
  // #swagger.tags = ['Articles']
  deleteArticle,
);

export default routeArticle;
