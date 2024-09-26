import { Router } from 'express';
import {
  deleteImage,
  uploadImages,
  uploadMultiple,
} from '../controllers/upload.controller';
import { upload } from '../middlewares/uploadImages';

const routeUpload = Router();
routeUpload.post('/', upload.single('upload'), uploadImages);
routeUpload.post('/multiple', upload.array('upload', 4), uploadMultiple);
routeUpload.delete('/:publicId', deleteImage);
export default routeUpload;
