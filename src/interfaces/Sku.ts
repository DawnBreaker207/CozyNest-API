import { Document, Types } from 'mongoose';
import { ProductType } from './Product';

export interface SkuType extends Document {
  option_value_id: any;
  skuCode: any;
  _id: Types.ObjectId;
  product_id: ProductType;
  name?: string;
  // SKU: string;
  slug: string;
  shared_url: string;
  price: number;
  stock: number;
  sold: number;
  price_before_discount?: number;
  price_discount_percent?: number;
  image?: {
    id: string;
    url: string;
  };
  // assets: {
  //   id: string;
  //   url: string;
  // }[];
  deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type Sku_Id = Pick<SkuType, '_id'>;
