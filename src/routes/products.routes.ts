import { Router } from 'express';
import ProductController from '../controllers/Product.controllers';

const routeProduct = Router();
const productController = new ProductController();

routeProduct.get('/', productController.Get_All);
routeProduct.get('/:id', productController.Get_One);
routeProduct.post('/', productController.Create);
routeProduct.put('/:id', productController.Update);
routeProduct.delete('/:id', productController.Delete);

export default routeProduct;
