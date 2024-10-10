import { Types } from 'mongoose';

export interface OptionValueType {
  _id: Types.ObjectId;
  product_id: Types.ObjectId; 
  option_id: Types.ObjectId; 
  label: string;
  value: string;
  created_at: Date;
  updated_at: Date;
}
