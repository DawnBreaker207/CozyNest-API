import { Document, Types } from 'mongoose';
import { Category_Id } from './Category';

export interface Image {
  url: string;
  public_id: string;
  id?: false;
}
export interface ProductType extends Document {
  _id: Types.ObjectId;
  name: string;
  thumbnail: string;
  // images?: Image[];
  categoryId: Category_Id;
  description: string;
  price: number;
  discount: number;
  isSale: boolean;
  // sold: number;
  isHidden?: boolean;
  SKU: string;
  variants: Types.ObjectId[];
  options: Types.ObjectId[];
  created_at: Date;
  updated_at: Date;
}

export type Product_Id = Pick<ProductType, '_id'>;
