import { Types } from 'mongoose';
import { Category_Id } from './Category';
export interface MaterialType {
  _id: Types.ObjectId;
  name: string;
}
export interface SizeType {
  _id: Types.ObjectId;
  name: string;
}
export interface ColorType {
  _id: Types.ObjectId;
  name: string;
}
type Material_Id = Pick<MaterialType, '_id'>;
type Size_Id = Pick<SizeType, '_id'>;
type Color_Id = Pick<ColorType, '_id'>;

export interface VariantType {
  _id: Types.ObjectId;
  extra_price: number;
  material_id: Material_Id;
  size_id: Size_Id;
  color_id: Color_Id;
  thumbnail: string;
  stock: number;
}
type Variant_Id = Pick<VariantType, '_id'>;

export interface ProductType {
  _id: Types.ObjectId;
  category_id: Category_Id;
  name: string;
  brand: string;
  thumbnail: string;
  description: string;
  base_price: number;
  variants: Variant_Id[];
}
