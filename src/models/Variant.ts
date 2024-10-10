import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { VariantType } from '@/interfaces/Variant';

const variantSchema = new mongoose.Schema<VariantType>(
  {
    sku_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sku', required: true },
    option_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Option', required: true },
    option_value_id: { type: mongoose.Schema.Types.ObjectId, ref: 'OptionValue', required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

variantSchema.plugin(mongoosePaginate);

export const Variant = mongoose.model<VariantType, PaginateModel<VariantType>>(
  'Variant',
  variantSchema
);

export type Variant_Id = Pick<VariantType, '_id'>;
