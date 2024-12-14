import { Review } from '@/models/Review';
import { ReviewType } from '@/interfaces/Review';
import { AppError } from '@/utils/errorHandle';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

// Lấy tất cả các review
export const getAllReviewsService = async () => {
  try {
    const reviews = await Review.find().populate([
      { path: 'product_id', select: 'name SKU description' },
      { path: 'user_id', select: 'username avatar phoneNumber' },
    ]);

    return reviews;
  } catch (error) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Unable to fetch reviews',
    );
  }
};

// Lấy tất cả các review theo product_id
export const getAllReviewsByProductIdService = async (product_id: string) => {
  if (!Types.ObjectId.isValid(product_id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid ProductId');
  }
  return await Review.find({ product_id }).populate([
    { path: 'user_id', select: 'username avatar phoneNumber' },
  ]);
};

// Tạo review mới
export const createReviewService = async (reviewData: ReviewType) => {
  return await Review.create(reviewData);
};

// Xóa review theo ID
export const deleteReviewService = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid ReviewId');
  }
  return await Review.findByIdAndDelete(id);
};
