import { Document, Schema } from 'mongoose';

// Define an interface for the Returned document
export interface RefundedType extends Document {
  order_id?: Schema.Types.ObjectId;
  bank_number: number;
  bank_name: string;
  is_confirm: boolean;
  customer_name?: string;
  phone_number?: number;
  images: string[];
}
