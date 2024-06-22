import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.ObjectId, ref: 'Category' },
  specs: Array,
});

export default mongoose.model('Product', productSchema);
