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

export interface OptionalValueType {
  _id: Types.ObjectId;
  product_id: Types.ObjectId;
  option_id: Types.ObjectId;
  label: string;
  value: string;
  created_at: Date;
  updated_at: Date;
}
export interface VariantType {
  _id: Types.ObjectId;
  sku_id: Types.ObjectId;
  option_id: Types.ObjectId;
  option_value_id: Types.ObjectId;
  product_id: Types.ObjectId;
  deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
