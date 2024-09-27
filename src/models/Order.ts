import mongoose from 'mongoose';
import { OrderType } from '@/interfaces/Order';

const orderItem = new mongoose.Schema(
  {
    products: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    totalQuantity: { type: Number },
    totalPrice: { type: Number },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema<OrderType>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    shipping: { type: String },
    fullName: { type: String },
    feeShipping: { type: String },
    phoneShipping: { type: String },
    addressShipping: { type: String },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    status: {
      type: String,
      enum: ['Pending', 'Success', 'Cancelled'],
      default: 'Pending',
    },
    orderTime: { type: Date },
    details: [orderItem],
    billTotals: { type: Number },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model<OrderType>('Order', orderSchema);
