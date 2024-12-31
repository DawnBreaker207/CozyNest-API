import mongoose from 'mongoose';
import { CartType } from '../interfaces/Cart';

const cartSchema = new mongoose.Schema<CartType>(
  {
    cart_id: {
      type: String,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isGuest: { type: Boolean, default: false },
    products: [
      {
        sku_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SKU',
          required: true,
        },
        quantity: { type: Number, min: 1, required: true },
        price: { type: Number, required: true },
        price_before_discount: {
          type: Number,
          default: 0,
        },
        price_discount_percent: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalPrice: { type: Number, default: 0 },
    deleted_at: {
      type: Date,
      default: null,
    },
    delete: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model<CartType>('Cart', cartSchema);
