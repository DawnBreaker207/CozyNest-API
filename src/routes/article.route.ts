import { createArticle, deleteArticle, getAll, getArticleDetail, updateArticle } from "@/controllers/article.controller";
import validBodyRequest from "@/middlewares/validBodyRequest";
import { articleSchema } from "@/validations/article.validation";
import { Router } from "express";


const routeArticle = Router();
//*get all
routeArticle.get('/',getAll);

//*get one
routeArticle.get('/:id',getArticleDetail);

//*create
routeArticle.post('/',createArticle,validBodyRequest(articleSchema));

//*update
routeArticle.put('/:id',updateArticle,validBodyRequest(articleSchema));

//*delete
routeArticle.delete('/:id',deleteArticle);

export default routeArticle;