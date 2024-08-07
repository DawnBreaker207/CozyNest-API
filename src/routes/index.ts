import { Router } from 'express';
import routeAuthentication from './authentication.route';
import routeCategory from './categories.route';
import routeColor from './color.route';
import routeProduct from './products.route';
import routeSize from './size.route';
import routeUpload from './upload.route';

const router = Router();
router.use('/products', routeProduct);
router.use('/categories', routeCategory);
router.use('/color', routeColor);
router.use('/size', routeSize);
router.use('/auth', routeAuthentication);
router.use('/upload', routeUpload);
export default router;
