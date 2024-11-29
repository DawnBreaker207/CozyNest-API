import { Types } from 'mongoose';
import {  Product_Id } from './Product';

export interface CategoryType {
  _id?: Types.ObjectId | string;
  name: string;
  thumbnail?: string;
  isHidden: boolean;
  products: Product_Id[];
  type: string;
}
export type Category_Id = Pick<CategoryType, '_id'>;
