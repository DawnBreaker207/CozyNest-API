import { Types } from 'mongoose';

export interface OrderType {
  userId: Types.ObjectId;
  shipping: string;
  fullName: string;
  feeShipping: string;
  phoneShipping: string;
  addressShipping: string;
  payment: Types.ObjectId;
  status: string;
  orderTime: Date;
  details: [
    {
      products: Types.ObjectId;
      totalQuantity: number;
      totalPrice: number;
    }
  ];
  billTotals: number;
}
