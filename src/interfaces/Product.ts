import { Document, Types } from 'mongoose';
import { Category_Id } from './Category';

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
