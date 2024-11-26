import { Types } from 'mongoose';
import { CouponType } from './Coupon';

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
  coupon: CouponType;
  totalPrice: number;
  deleted_at: Date | null;
  delete: boolean;
}
