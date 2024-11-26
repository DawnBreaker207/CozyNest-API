import { Document, Types } from 'mongoose';
import { CategoryType } from './Category';
import { OptionType, VariantType } from './Variant';

export interface Image {
  url: string;
  public_id: string;
  id?: false;
}
export interface ProductType extends Document {
  _id: Types.ObjectId;
  name: string;
  thumbnail: string;
  // images?: Image[];
  slug: string;
  category_id: CategoryType;
  description: string;
  // price: number;
  // discount: number;
  is_sale: boolean;
  // sold: number;
  variants: VariantType[];
  options: OptionType[];
  created_at: Date;
  updated_at: Date;
  is_hidden?: boolean;
}

export type Product_Id = Pick<ProductType, '_id'>;
