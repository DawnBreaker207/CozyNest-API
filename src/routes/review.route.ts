import {
  createReview,
  deleteReview,
  getAllReviews,
  getAllReviewsByProductId,
} from '@/controllers/review.controller';
// import { checkAuth } from '@/middlewares/checkAuth';
import { Router } from 'express';

const routeReview = Router();
//* Lấy tất cả các review
routeReview.get('/', getAllReviews);

//* Lấy tất cả các review trong product_id
routeReview.get('/:product_id', getAllReviewsByProductId);

//* Tạo review mới
routeReview.post('/', createReview);

//* Xóa một review
routeReview.delete('/:id', deleteReview);

export default routeReview;
