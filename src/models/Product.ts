import { ProductType } from '@/interfaces/Product';
import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema<ProductType>(
  {
    name: { type: String, required: true },
    // thumbnail: { type: String, required: true },
    SKU: { type: String, required: true, unique: true },
    category_id: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: true,
    },
    // images: [
    //   {
    //     url: { type: String, required: true },
    //     public_id: { type: String, require: true },
    //     _id: false,
    //   },
    // ],
    description: { type: String, required: true },
    variants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Variant' }],
    is_sale: { type: Boolean, default: false },
    is_hidden: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);
productSchema.plugin(mongoosePaginate);

export const Product = mongoose.model<ProductType, PaginateModel<ProductType>>(
  'Product',
  productSchema,
);
