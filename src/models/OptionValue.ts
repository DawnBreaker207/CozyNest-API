import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { OptionValueType } from '@/interfaces/OptionValue';

const optionValueSchema = new mongoose.Schema<OptionValueType>(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    option_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Option', required: true },
    label: { type: String, required: true },
    value: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

optionValueSchema.plugin(mongoosePaginate);
export type OptionValue_Id = Pick<OptionValueType, '_id'>;
export const OptionValue = mongoose.model<OptionValueType, PaginateModel<OptionValueType>>(
  'OptionValue',
  optionValueSchema
);
