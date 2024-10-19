import { Types } from 'mongoose';

export interface ProductCart {
  sku_id: Types.ObjectId;
  quantity: number;
  price: number;
  price_before_discount: number;
  price_discount_percent: number;
}

export interface CartType extends Document {
  userId: Types.ObjectId;
  guestId: String;
  isGuest: boolean;
  products: Types.DocumentArray<ProductCart>;
  totalPrice: number;
  deleted_at: Date;
  delete: boolean;
}
