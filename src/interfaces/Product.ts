import { Types } from 'mongoose';
import { Category_Id } from './Category';

export interface SizeType {
  name: string;
}
export interface ColorType {
  name: string;
}

export interface VariantType {
  name: string;
  extra_price: number;
  size: SizeType;
  color: ColorType;
  thumbnail: string;
  stock: number;
}
export interface ProductType {
  _id: Types.ObjectId;
  category: Category_Id[];
  name: string;
  brand: string;
  thumbnail: string;
  description: string;
  base_price: number;
  isHidden: boolean;
  variants: VariantType[];
}
export type Product_Id = Pick<ProductType, '_id'>;
