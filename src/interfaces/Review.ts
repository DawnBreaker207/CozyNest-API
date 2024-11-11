import { Document, Types } from 'mongoose';

export interface ReviewType extends Document {
  sku_id: Types.ObjectId;
  user_id: Types.ObjectId;
  rating: number;
  comment: string;
  image?: {
    id: string;
    url: string;
  };
}
