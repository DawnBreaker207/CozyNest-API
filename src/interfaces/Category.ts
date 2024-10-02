import { Types } from 'mongoose';
import { Image, Product_Id } from './Product';

export interface CategoryType {
  _id?: Types.ObjectId | string;
  name: string;
  thumbnail?: Image;
  isHidden: boolean;
  products: Product_Id[];
  type: string;
}
export type Category_Id = Pick<CategoryType, '_id'>;
