import { Router } from 'express';
import routeAuthentication from './authentication.route';
import routeCategory from './categories.route';
import routeProduct from './products.route';
import routeUpload from './upload.route';
import routeMail from './mail';
// import routeColor from './color.route';
// import routeSize from './size.route';

const router = Router();
router.use('/products', routeProduct);
router.use('/categories', routeCategory);
router.use('/auth', routeAuthentication);
router.use('/upload', routeUpload);
router.use('mail', routeMail);
// router.use('/size', routeSize);
// router.use('/color', routeColor);
export default router;
