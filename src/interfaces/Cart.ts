import { Types } from 'mongoose';

export interface ProductCart {
  sku_id: Types.ObjectId;
  quantity: number;
  price: number;
  price_before_discount?: number;
  price_discount_percent?: number;
}

export interface CartType extends Document {
  cart_id: string;
  userId: Types.ObjectId;
  guestId?: string;
  isGuest: boolean;
  products: ProductCart[];
  totalPrice: number;
  deleted_at: Date | null;
  delete: boolean;
}
