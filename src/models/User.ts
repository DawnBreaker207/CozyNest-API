import mongoose from 'mongoose';

interface User {
  email: string;
  password: string;
}

const userSchema = new mongoose.Schema<User>({
  email: { type: String, required: true },
  password: { type: String, required: true },
});

export default mongoose.model<User>('User', userSchema);
