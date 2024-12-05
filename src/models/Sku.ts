import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { SkuType } from '@/interfaces/Sku';

const skuSchema = new mongoose.Schema<SkuType>(
  {
    name: { type: String },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    SKU: {type: String},
    slug: {
      type: String,
      unique: true,
      slug: 'name',
    },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    price_before_discount: { type: Number, default: 0 },
    price_discount_percent: { type: Number, default: 0 },
    image: {
      id: { type: String },
      url: { type: String },
    },
    // assets: [
    //   {
    //     id: { type: String },
    //     url: { type: String },
    //   },
    // ],
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

skuSchema.plugin(mongoosePaginate);

export const Sku = mongoose.model<SkuType, PaginateModel<SkuType>>(
  'SKU',
  skuSchema,
);
