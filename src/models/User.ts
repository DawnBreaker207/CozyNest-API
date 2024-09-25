import mongoose from 'mongoose';
import { PermissionType, RoleType, UserType } from '../interfaces/User';
import mongoosePaginate from 'mongoose-paginate-v2';

const permissionSchema = new mongoose.Schema<PermissionType>({
  name: { type: String, required: true, unique: true },
});
const roleSchema = new mongoose.Schema<RoleType>({
  name: { type: String, required: true, unique: true },
  permissions: [{ type: mongoose.Schema.ObjectId, ref: 'Permission' }],
});
const userSchema = new mongoose.Schema<UserType>(
  {
    username: { type: String },
    full_name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
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
  { timestamps: true, versionKey: false }
);
userSchema.plugin(mongoosePaginate);

export const Permission = mongoose.model<PermissionType>(
  'Permission',
  permissionSchema
);
export const Role = mongoose.model<RoleType>('Role', roleSchema);
export const User = mongoose.model<UserType>('User', userSchema);
