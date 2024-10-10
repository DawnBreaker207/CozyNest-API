import { Types } from 'mongoose';

export interface OptionType {
  _id: Types.ObjectId;
  product_id: Types.ObjectId; 
  label: string;
  name: string;
  position: number;
  created_at: Date;
  updated_at: Date;
}
