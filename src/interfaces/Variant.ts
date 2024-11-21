import { Document } from 'mongoose';
import { Types } from 'mongoose';
export interface OptionType extends Document {
  _id: Types.ObjectId;
  product_id: Types.ObjectId;
  name: string;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface OptionalValueType extends Document {
  _id: Types.ObjectId;
  option_id: Types.ObjectId;
  value: string;
  created_at: Date;
  updated_at: Date;
}
export interface VariantType {
  _id: Types.ObjectId;
  sku: string;
  product_id: Types.ObjectId;
  option_values: Types.ObjectId[];
  price: number;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}
