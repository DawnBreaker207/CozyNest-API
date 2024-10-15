import mongoosePaginate from 'mongoose-paginate-v2';
import mongoose, { PaginateModel } from 'mongoose';
import {
  // ColorType,
  ProductType,
  // SizeType,
  // VariantType,
} from '@/interfaces/Product';

// const sizeSchema = new mongoose.Schema<SizeType>(
//   {
//     name: { type: String, required: true, unique: true },
//   },
//   { _id: false, versionKey: false }
// );
// const colorSchema = new mongoose.Schema<ColorType>(
//   {
//     name: { type: String, required: true, unique: true },
//   },
//   { _id: false, versionKey: false }
// );
// const variantProductSchema = new mongoose.Schema<VariantType>({
//   name: { type: String },
//   extra_price: { type: Number },
//   size: { type: sizeSchema, required: true },
//   color: { type: colorSchema, required: true },
//   thumbnail: { type: String },
//   stock: { type: Number },
// });
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
    categoryId: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: true,
      },
    ],
    brand: { type: String },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    isSale: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },

    // Thêm liên kết đến SKU và biến thể
    skus: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sku' }],
    variants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Variant' }],
  },
  { timestamps: true, versionKey: false }
);
;

// export const Size = mongoose.model<SizeType>('Size', sizeSchema);
// export const Color = mongoose.model<ColorType>('Color', colorSchema);
productSchema.plugin(mongoosePaginate);

export const Product = mongoose.model<ProductType, PaginateModel<ProductType>>(
  'Product',
  productSchema
);
