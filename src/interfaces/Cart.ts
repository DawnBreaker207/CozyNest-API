import { Types } from 'mongoose';

export interface ProductCart {
  productId: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface CartType extends Document {
  userId: Types.ObjectId;
  products: Types.DocumentArray<ProductCart>;
  totalPrice: number;
}
