import { Document, Types } from 'mongoose';

export interface UserType extends Document {
  _id: Types.ObjectId;
  username: string;
  full_name: string;
  email: string;
  password?: string;
  role: string;
  phoneNumber: string;
  avatar: string;
  address: string;
  city: string;
  address_shipping: string;
  phone_shipping: string;
  status: boolean;
}

export type Register_Type = Pick<UserType, 'username' | 'email' | 'password'>;
export type Login_Type = Pick<UserType, 'email' | 'password'>;
