import { Types } from 'mongoose';
import { Product_Id } from './Product';

export interface CategoryType {
  _id?: Types.ObjectId;
  name: string;
  thumbnail?: string;
  isHidden: boolean;
  products: Product_Id[];
}
export type Category_Id = Pick<CategoryType, '_id'>;
