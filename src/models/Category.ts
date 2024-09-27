import mongoose from 'mongoose';
import { CategoryType } from '@/interfaces/Category';

const categorySchema = new mongoose.Schema<CategoryType>(
  {
    name: { type: String, required: true },
    thumbnail: {
      url: {
        type: String,
        required: true,
      },

      public_id: {
        type: String,
        required: true,
      },
    },
    isHidden: { type: Boolean, default: false },
    products: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: [] },
    ],
    type: {
      type: String,
      enum: ['normal', 'default'],
      default: 'normal',
    },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model<CategoryType>('Category', categorySchema);
