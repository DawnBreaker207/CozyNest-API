import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  status: { type: Boolean },
  type: { type: String },
  brand: { type: String },
});

export default mongoose.model('Payment', paymentSchema);
