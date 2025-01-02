import { Review } from '@/models/Review';
import { ReviewType } from '@/interfaces/Review';
import { AppError } from '@/utils/errorHandle';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { Order_Detail } from '@/models/Order';
import { Sku } from '@/models/Sku';

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
  const { product_id, order_id, user_id } = reviewData;

  // 1. Kiểm tra sản phẩm đã được đánh giá chưa
  const existingReview = await Review.findOne({
    product_id,
    order_id,
    user_id,
  });
  if (existingReview) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Sản phẩm đã được đánh giá trước đó.',
    );
  }

  const skuIds = await Sku.find({ product_id }, '_id').lean();
  const result = await Order_Detail.updateOne(
    { order_id, 'products.sku_id': { $in: skuIds.map((sku) => sku._id) } },
    { $set: { 'products.$.isReviewed': true } },
  )
  if (result.modifiedCount === 0) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Không thể cập nhật trạng thái đánh giá cho sản phẩm.',
    );
  }
  return await Review.create(reviewData);
};

// Xóa review theo ID
export const deleteReviewService = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid ReviewId');
  }
  return await Review.findByIdAndDelete(id);
};
