import { Router } from 'express';
import routeProduct from './products.routes';
import routeCategory from './categories.routes';
import routeAuthentication from './authentication.routes';

const router = Router();
router.use('/products', routeProduct);
router.use('/categories', routeCategory);
router.use('/auth', routeAuthentication);

export default router;
