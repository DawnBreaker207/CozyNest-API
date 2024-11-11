import { Review } from '@/models/Review';
import { ReviewType } from '@/interfaces/Review';
import { AppError } from '@/utils/errorHandle';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

// Lấy tất cả các review theo SKU
export const getAllReviewsService = async (sku_id: string) => {
  if (!Types.ObjectId.isValid(sku_id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid SkuId');
  }
  return await Review.find({ sku_id }).populate('user_id', 'name');
};

// Lấy một review theo ID
export const getReviewService = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid ReviewId');
  }
  return await Review.findById(id).populate('user_id', 'name');
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
