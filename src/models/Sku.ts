import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { SkuType } from '@/interfaces/Sku';

const skuSchema = new mongoose.Schema<SkuType>(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shared_url: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    price_before_discount: { type: Number, default: 0 },
    price_discount_percent: { type: Number, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    image: {
      id: { type: String, required: false },
      url: { type: String, required: false },
    },
    assets: [
      {
        id: { type: String, required: false },
        url: { type: String, required: false },
      },
    ],
    deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

skuSchema.plugin(mongoosePaginate);

export const Sku = mongoose.model<SkuType, PaginateModel<SkuType>>(
  'Sku',
  skuSchema
);
