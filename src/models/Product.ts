import mongoose from 'mongoose';
import {
  ColorType,
  MaterialType,
  ProductType,
  SizeType,
  VariantType,
} from '../interfaces/Product';
const materialSchema = new mongoose.Schema<MaterialType>({
  name: { type: String, required: true, unique: true },
});
const sizeSchema = new mongoose.Schema<SizeType>({
  name: { type: String, required: true, unique: true },
});
const colorSchema = new mongoose.Schema<ColorType>({
  name: { type: String, required: true, unique: true },
});
const variantProductSchema = new mongoose.Schema<VariantType>({
  extra_price: { type: Number },
  material_id: { type: mongoose.Schema.ObjectId, ref: 'Material' },
  size_id: { type: mongoose.Schema.ObjectId, ref: 'Size' },
  color_id: { type: mongoose.Schema.ObjectId, ref: 'Color' },
  thumbnail: { type: String },
  stock: { type: Number },
});
const productSchema = new mongoose.Schema<ProductType>({
  category_id: { type: mongoose.Schema.ObjectId, ref: 'Category' },
  name: { type: String, required: true },
  brand: { type: String },
  thumbnail: { type: String },
  description: { type: String, required: true },
  base_price: { type: Number, required: true },
  variants: [{ type: mongoose.Schema.ObjectId, ref: 'Variant' }],
});
export const Material = mongoose.model<MaterialType>(
  'Material',
  materialSchema
);
export const Size = mongoose.model<SizeType>('Size', sizeSchema);
export const Color = mongoose.model<ColorType>('Color', colorSchema);
export const VariantProduct = mongoose.model<VariantType>(
  'Variant',
  variantProductSchema
);
export const Product = mongoose.model<ProductType>('Product', productSchema);
