import { Document, Types } from 'mongoose';
type PaymentStatusType = 'Paid' | 'Unpaid';
type ShippingMethodType = 'Shipping' | 'In-store';

export interface ShipmentType {
  product_name?: string;
  payment_type_id?: number;
  note?: string;
  required_note?: string;
  return_phone?: string;
  return_address?: string;
  return_district_id?: number | null;
  return_ward_code?: string;
  client_order_code?: string;
  from_name?: string;
  from_phone?: string;
  from_address?: string;
  from_ward_name?: string;
  from_district_name?: string;
  from_province_name?: string;
  from_district_id?: string;
  to_name?: string;
  to_phone?: string;
  to_address?: string;
  to_ward_name?: string;
  to_district_name?: string;
  to_district_id?: number;
  to_province_name?: string;
  to_ward_code?: string;
  cod_amount?: number;
  content?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  cod_failed_amount?: number;
  pick_station_id?: number;
  deliver_station_id?: number | null;
  insurance_value?: number;
  service_id?: number;
  service_type_id?: number;
  coupon?: string | null;
  pickup_time?: number;
  pick_shift?: number[];
  // Items: ProductItem[];
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

export interface OrderType extends Document {
  customer_name: string;
  total_amount: number;
  user_id?: Types.ObjectId;
  coupon_id?: Types.ObjectId;
  email?: string;
  shop_address?: string;
  phone_number: string;
  payment_status?: PaymentStatusType;
  payment_method?: object;
  status?: string;
  status_detail?: {
    status: string;
    created_at: Date;
  }[];
  date_issued?: Date;
  payment_url?: string;
  content?: string;
  shipping_method?: ShippingMethodType;
  shipping_info?: Types.ObjectId;
  // products?: {
  //   productId: Types.ObjectId;
  //   originName: string;
  //   productName: string;
  //   thumbnail: string;
  //   price: number;
  // }[];
  order_details: OrderItemType[];
  billTotals?: number;
}
