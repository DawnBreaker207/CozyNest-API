import { paymentMethod, statusOrder } from '@/constants/initialValue';
import { OrderType } from '@/interfaces/Order';
import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { nanoid } from 'nanoid';

// const orderItem = new mongoose.Schema(
//   {
//     products: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
//     totalQuantity: { type: Number },
//     totalPrice: { type: Number },
//   },
//   { _id: false }
// );

const orderSchema = new mongoose.Schema<OrderType>(
  {
    invoiceId: {
      type: String,
      default: function () {
        return nanoid(10);
      },
      required: true,
    },
    userId: { type: mongoose.Schema.Types.Mixed, default: null },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        originName: { type: String, required: true },
        productName: { type: String, required: true },
        thumbnail: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    billTotals: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: paymentMethod,
      default: 'COD',
    },

    customerName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    note: { type: String, default: null },
    addressShipping: { type: String, required: true },
    orderTime: { type: Date },
    receivedDate: {
      type: String,
      default: null,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: statusOrder,
      default: 'Pending',
    },
  },
  { timestamps: true, versionKey: false }
);

orderSchema.plugin(mongoosePaginate);
export default mongoose.model<OrderType, PaginateModel<OrderType>>(
  'Order',
  orderSchema
);
