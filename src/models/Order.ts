import { OrderItemType, OrderType, ShippingInfoType } from '@/interfaces/Order';
import mongoose, { PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const orderItemSchema = new mongoose.Schema<OrderItemType>(
    {
      order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
      sku_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sku',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      price_before_discount: {
        type: Number,
        default: 0,
      },
      price_discount_percent: {
        type: Number,
        default: 0,
      },
      total_money: {
        type: Number,
        default: 0,
      },
    },
    {
      collection: 'order_details',
      timestamps: true,
      versionKey: false,
    },
  ),
  // TODO: Update
  shippingInfoSchema = new mongoose.Schema<ShippingInfoType>(
    {
      shipping_address: {
        type: String,
        required: true,
      },
      estimated_delivery_date: Date,
      shipping_company: {
        type: String,
        default: 'Giao hàng nhanh',
      },
      transportation_fee: {
        type: Number,
        default: 30000,
      },
      order_code: {
        type: String,
      },
    },
    {
      collection: 'shippings',
      timestamps: true,
      versionKey: false,
    },
  ),
  // Định nghĩa schema cho Order
  orderSchema = new mongoose.Schema<OrderType>(
    {
      customer_name: {
        type: String,
        // required: true,
      },
      total_amount: {
        type: Number,
        required: true,
      },

      email: { type: String, required: true },
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      payment_url: {
        type: String,
        required: true,
      },
      coupon_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
      },
      shop_address: {
        type: String,
      },
      phone_number: {
        type: String,
      },
      payment_status: {
        type: String,
        enum: ['Paid', 'Unpaid'],
        default: 'Unpaid',
      },
      payment_method: [
        {
          method: { type: String },
          status: { type: String },
          orderInfo: { type: String },
          orderType: { type: String },
          partnerCode: { type: String },
        },
      ],
      status: {
        type: String,
        default: 'Processing',
        //TODO: Update
        enum: [
          //Đang xử lý
          'Processing',
          //Chờ xác nhận
          'Pending',
          //Đã xác nhận
          'Confirmed',
          //Đang chờ bên vận chuyển
          'Pending-Ship',
          //Đang vận chuyển
          'Delivering',
          //Giao hàng thành công
          'Delivered',
          //Đã hủy đơn hàng
          'Canceled',
          //Đơn hàng hoàn thành
          'Completed',
          //Hoàn trả đơn hàng
          'Returned',
          //Hoàn trả đơn hàng và hoàn tiền
          'Refunded',
        ],
      },
      status_detail: [
        {
          status: {
            type: String,
            default: 'Processing',
            //TODO: Update
            enum: [
              //Đang xử lý
              'Processing',
              //Chờ xác nhận
              'Pending',
              //Đã xác nhận
              'Confirmed',
              //Đang chờ bên vận chuyển
              'Pending-Ship',
              //Đang vận chuyển
              'Delivering',
              //Giao hàng thành công
              'Delivered',
              //Đã hủy đơn hàng
              'Canceled',
              //Đơn hàng hoàn thành
              'Completed',
              //Hoàn trả đơn hàng
              'Returned',
              //Hoàn trả đơn hàng và hoàn tiền
              'Refunded',
            ],
          },
          created_at: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      date_issued: {
        type: Date,
        default: Date.now,
      },
      content: {
        type: String,
      },
      shipping_method: {
        type: String,
        enum: ['Shipping', 'In-store'],
        default: 'Shipping',
      },
      shipping_info: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipping',
      },
      products: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
          },
          originName: { type: String, required: true },
          productName: { type: String, required: true },
          thumbnail: { type: String, required: true },
          price: { type: Number, required: true },
        },
      ],
    },
    {
      collection: 'orders',
      timestamps: true,
      versionKey: false,
    },
  );

orderSchema.plugin(mongoosePaginate);

const Order = mongoose.model<OrderType, PaginateModel<OrderType>>(
    'Order',
    orderSchema,
  ),
  Order_Detail = mongoose.model<OrderItemType>('OrderDetail', orderItemSchema),
  Shipping = mongoose.model<ShippingInfoType>('Shipping', shippingInfoSchema);

export { Order, Order_Detail, Shipping };
