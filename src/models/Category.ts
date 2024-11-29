import mongoose from 'mongoose';
import { CategoryType } from '@/interfaces/Category';

const categorySchema = new mongoose.Schema<CategoryType>(
  {
    name: { type: String, required: true },
    thumbnail: {
     type: String,
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
  { timestamps: true, versionKey: false },
);

export default mongoose.model<CategoryType>('Category', categorySchema);
