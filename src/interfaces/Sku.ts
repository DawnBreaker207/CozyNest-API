import { Document, Types } from 'mongoose';
import { ProductType } from './Product';

export interface SkuType extends Document {
  _id: Types.ObjectId;
  SKU: string;
  product_id: ProductType;
  name?: string;
  slug: string;
  shared_url: string;
  price: number;
  price_before_discount?: number;
  price_discount_percent?: number;
  stock: number;
  image?: {
    id: string;
    url: string;
  };
  assets: {
    id: string;
    url: string;
  }[];
  deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type Sku_Id = Pick<SkuType, '_id'>;
