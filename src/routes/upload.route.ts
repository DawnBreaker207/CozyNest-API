import { Router } from 'express';
import {
  deleteImage,
  uploadImages,
  uploadMultiple,
} from '../controllers/upload.controller';
import { upload } from '../middlewares/uploadImages';

const routeUpload = Router();
routeUpload.post('/images', upload.single('upload'), uploadImages);
routeUpload.post('/images/multiple', upload.array('upload', 4), uploadMultiple);
routeUpload.delete('images/:publicId', deleteImage);
export default routeUpload;
