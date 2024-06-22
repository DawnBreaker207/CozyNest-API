import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  product: [{ type: mongoose.Schema.ObjectId, ref: 'Product' }],
});

export default mongoose.model('Category', categorySchema);
