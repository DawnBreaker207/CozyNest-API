import { ReturnedType } from "@/interfaces/Return";
import mongoose, { PaginateModel, Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// Create the schema
const returnedSchema = new Schema<ReturnedType>(
  {
    order_id: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    reason: {
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
    collection: "returned",
    timestamps: true,
    versionKey: false,
  }
);

returnedSchema.plugin(mongoosePaginate);

const Returned = mongoose.model<ReturnedType, PaginateModel<ReturnedType>>(
  "Returned",
  returnedSchema
);
export { Returned };