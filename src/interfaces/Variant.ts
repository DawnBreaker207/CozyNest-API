import { Document } from 'mongoose';
import { Types } from 'mongoose';
import { SkuType } from './Sku';
import { ProductType } from './Product';
export interface OptionType extends Document {
  _id: Types.ObjectId;
  product_id: Types.ObjectId;
  name: string;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface OptionValueType extends Document {
  _id: Types.ObjectId;
  option_id: OptionType['_id'];
  value: string;
  created_at: Date;
  updated_at: Date;
}
export interface VariantType {
  _id: Types.ObjectId;
  sku_id: SkuType;
  product_id: ProductType;
  option_values: OptionValueType[];
  // price: number;
  // stock: number;
  image: string;
  created_at: Date;
  updated_at: Date;
}
