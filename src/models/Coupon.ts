import { CouponType } from '@/interfaces/Coupon';
import mongoose from 'mongoose';
import { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const couponSchema = new mongoose.Schema<CouponType>(
  {
    name: { type: String },
    couponCode: { type: String },
    couponValue: { type: Number },
    couponQuantity: { type: Number, default: 0 },

    couponStartDate: { type: Date, default: null },
    couponEndDate: { type: Date, default: null },

    status: { type: Boolean, default: true },

    createdBy: { type: String },
    updatedBy: { type: String },

    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
couponSchema.plugin(mongoosePaginate);

export default mongoose.model<CouponType, PaginateModel<CouponType>>(
  'Coupon',
  couponSchema
);
