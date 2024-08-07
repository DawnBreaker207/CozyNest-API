import { Router } from 'express';
import {
  Create_Size,
  Delete_Size,
  Get_All_Size,
  Get_One_Size,
  Update_Size,
} from '../controllers/variant.controllers';

const routeSize = Router();
routeSize.get('/', Get_All_Size);
routeSize.get('/:id', Get_One_Size);
routeSize.post('/', Create_Size);
routeSize.put('/:id', Update_Size);
routeSize.patch('/:id', Delete_Size);
export default routeSize;
