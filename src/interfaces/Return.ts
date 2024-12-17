import { Document, Schema } from 'mongoose';

// Define an interface for the Returned document
export interface ReturnedType extends Document {
  order_id?: Schema.Types.ObjectId;
  reason: string;
  is_confirm: string;
  reason_cancel: string;
  customer_name?: string;
  phone_number?: number;
  images: string[];
}
