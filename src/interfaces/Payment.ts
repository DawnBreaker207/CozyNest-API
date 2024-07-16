import { Types } from 'mongoose';

export interface PaymentType {
  _id: Types.ObjectId;
  status: boolean;
  type: string;
  brand: string;
}
export type Payment_Id = Pick<PaymentType, '_id'>;
