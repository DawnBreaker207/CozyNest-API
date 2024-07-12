import { Router } from 'express';
import CategoryController from '../controllers/Category.controllers';


const routeCategory = Router();
const categoryController = new CategoryController();

routeCategory.get('/', categoryController.getAll);
routeCategory.get('/:id', categoryController.getOne);
routeCategory.post('/', categoryController.create);
routeCategory.put('/:id', categoryController.update);
routeCategory.delete('/:id', categoryController.delete);

export default routeCategory;
