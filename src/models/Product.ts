import mongoose from 'mongoose';
import {
  // ColorType,
  ProductType,
  // SizeType,
  // VariantType,
} from '../interfaces/Product';

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
    name: { type: String, required: true },
    category: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: true,
      },
    ],
    brand: { type: String },
    thumbnail: { type: String },
    description: { type: String, required: true },
    base_price: { type: Number, required: true },
    isHidden: { type: Boolean, default: false },
    // variants: [variantProductSchema],
  },
  { timestamps: true, versionKey: false }
);

// export const Size = mongoose.model<SizeType>('Size', sizeSchema);
// export const Color = mongoose.model<ColorType>('Color', colorSchema);
export const Product = mongoose.model<ProductType>('Product', productSchema);
