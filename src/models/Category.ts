import mongoose from 'mongoose';
import { CategoryType } from '../interfaces/Category';

const categorySchema = new mongoose.Schema<CategoryType>({
  name: { type: String, required: true },
  thumbnail: { type: String },
});

export default mongoose.model<CategoryType>('Category', categorySchema);
