import {
  deleteImage,
  uploadImages,
  uploadMultiple,
} from '@/controllers/upload.controller';
import { upload } from '@/middlewares/uploadImages';
import { Router } from 'express';

const routeUpload = Router();

//* Upload single image
routeUpload.post(
  '/',
  upload.single('upload'),
  // #swagger.tags = ['Upload']
  uploadImages,
);

//* Upload multiple image
routeUpload.post(
  '/multiple',
  upload.array('upload', 4),
  // #swagger.tags = ['Upload']
  uploadMultiple,
);

//* Delete single image
routeUpload.delete(
  '/:publicId',
  // #swagger.tags = ['Upload']
  deleteImage,
);
export default routeUpload;
