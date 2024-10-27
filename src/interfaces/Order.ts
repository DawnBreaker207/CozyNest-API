import { Types } from "mongoose";

export interface OrderType extends Document {
  customer_name: string;
  total_amount: number;
  user_id?: Types.ObjectId;
  coupon_id?: Types.ObjectId;
  email?: string;
  shop_address?: string;
  phone_number: number;
  payment_status?: "paid" | "unpaid";
  payment_method?: object;
  status?: string;
  status_detail?: {
    status: string;
    created_at: Date;
  }[];
  date_issued?: Date;
  payment_url?: string;
  content?: string;
  shipping_method?: "shipped" | "at_store";
  shipping_info?: Types.ObjectId;
    products?: {
      productId: Types.ObjectId;
      originName: string;
      productName: string;
      thumbnail: string;
      price: number;
    }[]
    billTotals?: number;
}

export interface OrderItemType extends Document {
  order_id?: Types.ObjectId;
  sku_id: Types.ObjectId;
  quantity: number;
  price: number;
  price_before_discount?: number;
  price_discount_percent?: number;
  total_money?: number;
}

export interface ShippingInfoType extends Document {
  shipping_address: string;
  estimated_delivery_date?: Date;
  shipping_company?: string;
  transportation_fee?: number;
  order_code?: string;
  created_at?: Date;
  updated_at?: Date;
}
