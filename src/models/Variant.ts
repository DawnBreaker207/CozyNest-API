import { OptionType, OptionValueType, VariantType } from '@/interfaces/Variant';
import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

// Option Schema
const optionSchema = new mongoose.Schema<OptionType>(
    {
      name: { type: String, required: true },
      position: { type: Number },
    },
    { timestamps: true, versionKey: false },
  ),
  // OptionalValue Schema
  optionValueSchema = new mongoose.Schema<OptionValueType>(
    {
      option_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Option',
        required: true,
      },
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
      option_values: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Option_Value',
          required: true,
        },
      ],
      image: { type: String },
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
// Export OptionalValue Models
export const OptionalValue = mongoose.model<
  OptionValueType,
  PaginateModel<OptionValueType>
>('Option_Value', optionValueSchema);
// Export Variant Models
export const Variant = mongoose.model<VariantType, PaginateModel<VariantType>>(
  'Variant',
  variantSchema,
);
