import { Document, Schema } from 'mongoose';

// Define an interface for the Returned document
export interface ReturnedType extends Document {
  order_id?: Schema.Types.ObjectId;
  reason: string;
  is_confirm: boolean;
  customer_name?: string;
  phone_number?: number;
  images: string[];
}
