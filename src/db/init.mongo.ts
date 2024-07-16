import mongoose from 'mongoose';
import { URI } from '../utils/env';
import { seedPermissionAndRole } from '../middlewares/checkPermission';

// const URI: dot = process.env.URI;
const connectDB = async (URI: string | undefined) => {
  try {
    await mongoose.connect(URI || '');
    console.log('Connect DB success');
    await seedPermissionAndRole();
  } catch (error) {
    console.log(error);
  }
};
const instanceDB = connectDB(URI);
export default instanceDB;
