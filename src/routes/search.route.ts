import {
  searchArticles,
  searchProducts,
} from '@/controllers/search.controller';
import { Router } from 'express';

const routeSearch = Router();

routeSearch.get('/', searchProducts);
routeSearch.get('/articles', searchArticles);

export default routeSearch;
