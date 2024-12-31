import { RefundedType } from '@/interfaces/Refund';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

// Create the schema
const refundedSchema = new Schema<RefundedType>(
  {
    order_id: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    bank_number: {
      type: Number,
      required: true,
    },
    bank_name: {
      type: String,
      required: true,
    },
    is_confirm: {
      type: Boolean,
      default: false,
    },
    customer_name: {
      type: String,
    },
    phone_number: {
      type: Number,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    collection: 'refunded',
    timestamps: true,
    versionKey: false,
  },
);

refundedSchema.plugin(mongoosePaginate);

const Refunded = mongoose.model<RefundedType, PaginateModel<RefundedType>>(
  'Refunded',
  refundedSchema,
);
export { Refunded };
