import { Router } from 'express';
import ProductController from '../controllers/Products/Product.controllers';

const routeProduct = Router();
const productController = new ProductController();

routeProduct.get('/', productController.getAll);
routeProduct.get('/:id', productController.getOne);
routeProduct.post('/', productController.create);
routeProduct.put('/:id', productController.update);
routeProduct.delete('/:id', productController.delete);

export default routeProduct;
