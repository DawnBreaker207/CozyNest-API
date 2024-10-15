import { Types } from 'mongoose';

export interface SkuType {
  _id: Types.ObjectId;
  product_id: Types.ObjectId;
  sku: string;
  name: string;
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
