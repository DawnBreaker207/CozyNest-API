import mongoose, { Schema, PaginateModel } from 'mongoose';
import { ReviewType } from '@/interfaces/Review';
import mongoosePaginate from 'mongoose-paginate-v2';

const reviewSchema = new Schema<ReviewType>(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    image: {
    type: String
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reviewSchema.plugin(mongoosePaginate);

export const Review = mongoose.model<ReviewType, PaginateModel<ReviewType>>(
  'Review',
  reviewSchema,
);
