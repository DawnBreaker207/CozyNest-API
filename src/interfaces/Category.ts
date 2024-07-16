import { Types } from 'mongoose';

export interface CategoryType {
  _id?: Types.ObjectId;
  name: string;
  thumbnail?: string;
}
export type Category_Id = Pick<CategoryType, '_id'>;
