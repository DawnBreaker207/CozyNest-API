import { UserType } from '@/interfaces/User';
import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const userSchema = new mongoose.Schema<UserType>(
  {
    username: { type: String },
    full_name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'manager', 'member'],
      default: 'member',
    },
    phoneNumber: { type: String, default: null },
    avatar: {
      type: String,
      default:
        'https://res.cloudinary.com/devr9hihw/image/upload/c_crop,g_auto,h_800,w_800/cld-sample.jpg',
    },
    address: { type: String, default: null },
    city: { type: String },
    address_shipping: { type: String },
    status: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);
userSchema.plugin(mongoosePaginate);

export default mongoose.model<UserType, PaginateModel<UserType>>(
  'User',
  userSchema,
);
