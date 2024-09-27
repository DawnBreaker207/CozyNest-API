import mongoose from 'mongoose';
import { CartType } from '../interfaces/Cart';

const cartSchema = new mongoose.Schema<CartType>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, min: 1 },
        price: { type: Number },
      },
    ],
    totalPrice: { type: Number },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model<CartType>('Cart', cartSchema);
