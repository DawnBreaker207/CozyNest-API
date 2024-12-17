import { Document } from 'mongoose';
import { Types } from 'mongoose';
import { SkuType } from './Sku';
import { ProductType } from './Product';
export interface OptionType extends Document {
  _id: Types.ObjectId;
  product_id: Types.ObjectId;
  option_value_id: Types.ObjectId;
  name: string;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface OptionValueType extends Document {
  _id: Types.ObjectId;
  option_id: OptionType;
  product_id: ProductType;
  label: string;
  value: string;
  created_at: Date;
  updated_at: Date;
}
export interface VariantType extends Document {
  stock: any;
  _id: Types.ObjectId;
  sku_id: SkuType;
  product_id: ProductType;
  option_id: OptionType;
  option_value_id: OptionValueType;
  // price: number;
  // stock: number;
  image: string;
  created_at: Date;
  updated_at: Date;
  delete: boolean;
  deleted_at: string;
}
