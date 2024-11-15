import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { SkuType } from '@/interfaces/Sku';

const skuSchema = new mongoose.Schema<SkuType>(
  {
    sku_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    SKU: { type: String },
    name: { type: String },
    slug: {
      type: String,
      unique: true,
      slug: 'name',
    },
    price: { type: Number, default: 0 },
    price_before_discount: { type: Number, default: 0 },
    price_discount_percent: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    image: {
      id: { type: String },
      url: { type: String },
    },
    assets: [
      {
        id: { type: String },
        url: { type: String },
      },
    ],
  },
  { timestamps: true, versionKey: false },
);

skuSchema.plugin(mongoosePaginate);

export const Sku = mongoose.model<SkuType, PaginateModel<SkuType>>(
  'Sku',
  skuSchema,
);
