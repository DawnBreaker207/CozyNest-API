import { Types } from 'mongoose';

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
