import { Types } from 'mongoose';
import { Category_Id } from './Category';
import { Sku_Id } from './Sku';
import { Variant_Id } from '@/models/Variant';

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
}
export interface ProductType {
  _id: Types.ObjectId;
  originId: Types.ObjectId | null;
  name: string;
  thumbnail: string;
  images: Image[];
  categoryId: Category_Id;
  brand: string;
  description: string;
  price: number;
  discount: number;
  sold: number;
  isSale: boolean;
  isHidden: boolean;
  SKU: string;           
  variants: Variant_Id[];  
}

export type Product_Id = Pick<ProductType, '_id'>;
