import { OptionType, OptionValueType, VariantType } from '@/interfaces/Variant';
import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

// Option Schema
const optionSchema = new mongoose.Schema<OptionType>(
    {
      name: { type: String, required: true },
      position: { type: Number },
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
    },
    { timestamps: true, versionKey: false },
  ),
  // OptionValue Schema
  optionValueSchema = new mongoose.Schema<OptionValueType>(
    {
      option_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Option',
        required: true,
      },
      label: { type: String, required: true },
      value: { type: String, required: true },
    },
    { timestamps: true, versionKey: false },
  ),
  variantSchema = new mongoose.Schema<VariantType>(
    {
      sku_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SKU',
        required: true,
      },
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      option_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Option',
        required: true,
      },
      option_value_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Option_Value',
        required: true,
      },
      delete: { type: Boolean, default: false },
      deleted_at: { type: String, default: null },
      // image: { type: String },
    },
    { timestamps: true, versionKey: false },
  );

// Paginate
optionSchema.plugin(mongoosePaginate);
optionValueSchema.plugin(mongoosePaginate);
variantSchema.plugin(mongoosePaginate);

// Export Option Models
export const Option = mongoose.model<OptionType, PaginateModel<OptionType>>(
  'Option',
  optionSchema,
);
// Export OptionValue Models
export const OptionValue = mongoose.model<
  OptionValueType,
  PaginateModel<OptionValueType>
>('Option_Value', optionValueSchema);
// Export Variant Models
export const Variant = mongoose.model<VariantType, PaginateModel<VariantType>>(
  'Variant',
  variantSchema,
);
