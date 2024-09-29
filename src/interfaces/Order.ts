import { Types } from 'mongoose';

interface OrderProduct {
  productId: Types.ObjectId;
  originName: string;
  productName: string;
  thumbnail: string;
  price: number;
}
export interface OrderType {
  invoiceId: string;
  userId: Types.ObjectId | null;
  products: OrderProduct[];
  billTotals: number;

  paymentMethod: string;
  customerName: string;
  phoneNumber: string;

  email: string;
  note?: string | null;
  addressShipping: string;

  orderTime?: Date;
  receivedDate?: string | null;
  paid: boolean;
  status: string;

  createdAt?: Date;
  updatedAt?: Date;
}
