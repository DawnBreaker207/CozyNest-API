import {
  deleteImage,
  uploadImages,
  uploadMultiple,
} from '@/controllers/upload.controller';
import { upload } from '@/middlewares/uploadImages';
import { Router } from 'express';

const routeUpload = Router();

//* Upload single image
routeUpload.post('/', upload.single('upload'), uploadImages);

//* Upload multiple image
routeUpload.post('/multiple', upload.array('upload', 4), uploadMultiple);

//* Delete single image
routeUpload.delete('/:publicId', deleteImage);
export default routeUpload;
