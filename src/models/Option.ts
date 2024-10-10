import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { OptionType } from '@/interfaces/Option';

const optionSchema = new mongoose.Schema<OptionType>(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    label: { type: String, required: true },
    name: { type: String, required: true },
    position: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

optionSchema.plugin(mongoosePaginate);
export type Option_Id = Pick<OptionType, '_id'>;
export const Option = mongoose.model<OptionType, PaginateModel<OptionType>>('Option', optionSchema);
