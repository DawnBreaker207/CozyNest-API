import { searchProducts } from "@/controllers/search.controller";
import { Router } from "express";


const routeSearch = Router();

routeSearch.get('/', searchProducts);


export default routeSearch;