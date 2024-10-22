import { Variant_Id } from '@/models/Variant';
import { Document, Types } from 'mongoose';
import { Category_Id } from './Category';

// export interface SizeType {
//   name: string;
// }
// export interface ColorType {
//   name: string;
// }

// export interface VariantType {
//   name: string;
//   extra_price: number;
//   size: SizeType;
//   color: ColorType;
//   thumbnail: string;
//   stock: number;
// }

export interface Image {
  url: string;
  public_id: string;
  id?: false;
}
export interface ProductType extends Document {
  _id: Types.ObjectId;
  originId: Types.ObjectId | null;
  name: string;
  thumbnail: string;
  images?: Image[];
  categoryId: Category_Id;
  brand: string;
  description: string;
  price: number;
  discount: number;
  sold: number;
  isSale: boolean;
  isHidden?: boolean;
  SKU: string;
  variants: Types.ObjectId[];
}

export type Product_Id = Pick<ProductType, '_id'>;
