import { ProductType } from '@/interfaces/Product';
import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema<ProductType>(
  {
    // Original id for original products
    originId: { type: mongoose.Types.ObjectId, default: null },
    name: { type: String, required: true },
    thumbnail: { type: String },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, require: true },
        _id: false,
      },
    ],
    categoryId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: true,
    },

    brand: { type: String },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    isSale: { type: Boolean, default: false },
    // Thêm liên kết đến SKU và biến thể
    SKU: { type: String, unique: true },
    variants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Variant' }],
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);
productSchema.plugin(mongoosePaginate);

export const Product = mongoose.model<ProductType, PaginateModel<ProductType>>(
  'Product',
  productSchema,
);
