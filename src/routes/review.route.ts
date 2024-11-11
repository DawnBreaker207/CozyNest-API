import {
  getAllReviews,
  getReview,
  createReview,
  deleteReview,
} from '@/controllers/review.controller';
import { checkAuth } from '@/middlewares/checkAuth';
import { checkPermission } from '@/middlewares/checkPermission';
import { Router } from 'express';

const routeReview = Router();

//* Lấy tất cả các review cho SKU cụ thể
routeReview.get('/:sku_id', getAllReviews);

//* Lấy chi tiết một review
routeReview.get('/detail/:id', getReview);

//* Tạo review mới
routeReview.post(
  '/',
  checkAuth,
  checkPermission,

  createReview,
);

//* Xóa một review
routeReview.delete('/:id', checkAuth, checkPermission, deleteReview);

export default routeReview;
