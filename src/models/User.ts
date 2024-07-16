import mongoose from 'mongoose';
import { PermissionType, RoleType, UserType } from '../interfaces/User';
const permissionSchema = new mongoose.Schema<PermissionType>({
  name: { type: String, required: true, unique: true },
});
const roleSchema = new mongoose.Schema<RoleType>({
  name: { type: String, required: true, unique: true },
  permissions: [{ type: mongoose.Schema.ObjectId, ref: 'Permission' }],
});
const userSchema = new mongoose.Schema<UserType>({
  username: { type: String },
  full_name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: [{ type: mongoose.Schema.ObjectId, ref: 'Role' }],
  phoneNumber: { type: String },
  avatar: { type: String },
  address: { type: String },
  city: { type: String },
  address_shipping: { type: String },
});

export const Permission = mongoose.model<PermissionType>(
  'Permission',
  permissionSchema
);
export const Role = mongoose.model<RoleType>('Role', roleSchema);
export const User = mongoose.model<UserType>('User', userSchema);
