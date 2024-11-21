import {
  OptionType,
  OptionalValueType,
  VariantType,
} from '@/interfaces/Variant';
import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

// Option Schema
const optionSchema = new mongoose.Schema<OptionType>(
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: { type: String, unique: true, required: true },
      position: { type: Number },
    },
    { timestamps: true, versionKey: false },
  ),
  // OptionalValue Schema
  optionalValueSchema = new mongoose.Schema<OptionalValueType>(
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
      sku: {
        type: String,
      },
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      option_values: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'OptionalValue',
          required: true,
        },
      ],
      quantity: { type: Number },
    },
    { timestamps: true, versionKey: false },
  );

// Paginate
optionSchema.plugin(mongoosePaginate);
optionalValueSchema.plugin(mongoosePaginate);
variantSchema.plugin(mongoosePaginate);

// Export Option Models
export const Option = mongoose.model<OptionType, PaginateModel<OptionType>>(
  'Option',
  optionSchema,
);
// Export OptionalValue Models
export const OptionalValue = mongoose.model<
  OptionalValueType,
  PaginateModel<OptionalValueType>
>('OptionalValue', optionalValueSchema);
// Export Variant Models
export const Variant = mongoose.model<VariantType, PaginateModel<VariantType>>(
  'Variant',
  variantSchema,
);
