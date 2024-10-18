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
    label: { type: String },
    name: { type: String, unique: true },
    position: { type: Number },
  },
  { timestamps: true, versionKey: false }
);

// OptionalValue Schema
const optionalValueSchema = new mongoose.Schema<OptionalValueType>(
  {
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
    label: { type: String },
    value: { type: String },
  },
  { timestamps: true, versionKey: false }
);

const variantSchema = new mongoose.Schema<VariantType>(
  {
    sku_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sku',
    },
    option_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Option',
    },
    option_value_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OptionalValue',
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  },
  { timestamps: true, versionKey: false }
);

// Paginate
optionSchema.plugin(mongoosePaginate);
optionalValueSchema.plugin(mongoosePaginate);
variantSchema.plugin(mongoosePaginate);

// Pick one type
export type Option_Id = Pick<OptionType, '_id'>;
export type OptionalValue_Id = Pick<OptionalValueType, '_id'>;
export type Variant_Id = Pick<VariantType, '_id'>;

// Export Option Models
export const Option = mongoose.model<OptionType, PaginateModel<OptionType>>(
  'Option',
  optionSchema
);
// Export OptionalValue Models
export const OptionalValue = mongoose.model<
  OptionalValueType,
  PaginateModel<OptionalValueType>
>('OptionalValue', optionalValueSchema);
// Export Variant Models
export const Variant = mongoose.model<VariantType, PaginateModel<VariantType>>(
  'Variant',
  variantSchema
);
