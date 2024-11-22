import {
  getAllReviews,
  createReview,
  deleteReview,
} from '@/controllers/review.controller';
import { checkAuth } from '@/middlewares/checkAuth';
import { checkPermission } from '@/middlewares/checkPermission';
import { Router } from 'express';

const routeReview = Router();

//* Lấy tất cả các review
routeReview.get('/:product_id', getAllReviews);

//* Tạo review mới
routeReview.post('/', createReview);

//* Xóa một review
routeReview.delete('/:id', checkAuth, deleteReview);

export default routeReview;
