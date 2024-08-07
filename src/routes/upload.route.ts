import { Router } from 'express';
import { updateImages } from '../middlewares/uploadImages';

const routeUpload = Router();
routeUpload.post('/images', updateImages.single('upload'), )
export default routeUpload;
