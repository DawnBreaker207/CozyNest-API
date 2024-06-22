import mongoose from 'mongoose';
import 'dotenv/config';
// const URI: dot = process.env.URI;
const connectDB = async (URI: string | undefined) => {
  try {
    await mongoose.connect(URI || '');
    console.log('Connect DB success');
  } catch (error) {
    console.log(error);
  }
};
const instanceDB = connectDB(process.env.URI);
export default instanceDB;
