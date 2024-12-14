import { configSendMail } from '@/configs/configMail';
import { statusOrder, timeCounts } from '@/constants/initialValue';
import { messagesSuccess } from '@/constants/messages';
import { CartType } from '@/interfaces/Cart';
import { OrderType } from '@/interfaces/Order';
import Cart from '@/models/Cart';
import { Order, Order_Detail, Shipping } from '@/models/Order';
import { Returned } from '@/models/Return';
import { Sku } from '@/models/Sku';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';
import {
  calculateFee,
  getAddressLocation,
  getTokenPrintBill,
} from '@/utils/shipment';
import { sendOrder } from '@/utils/texts';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import mongoose, { PaginateOptions } from 'mongoose';
import {
  createMomoService,
  createVnPayService,
  createZaloPayService,
} from './payment.service';
import { createDeliveryOrderService } from './shipment.service';

// Utils functions
/**
 *
 * @param dateTime
 * @returns
 */
export const formatDateTime = (date: Date): string =>
  moment(date).format('DD/MM/YYYY HH:mm:ss');
/**
 *
 * @param data
 * @param day
 * @param res
 * @param from
 * @param to
 * @returns
 */

export const filterOrderDay = async (
  data: any,
  day: number,
  from?: string,
  to?: string,
) => {
  const today = new Date(),
    filterData: OrderType[] = [];

  if (day) {
    const dayOfPast =
      today.getTime() - day * (timeCounts.hours_24 || 24 * 60 * 60 * 1000);
    for (const item of data) {
      const itemDate = new Date(item.createdAt || Date.now());
      if (itemDate.getTime() >= dayOfPast && itemDate <= today) {
        filterData.push(item);
      }
    }
  }
  if (from && to) {
    const fromDate = new Date(from),
      toDate = new Date(to);

    toDate.setHours(23, 59, 59, 999);
    for (const item of data) {
      const itemDate = new Date(item.createdAt || Date.now());
      if (itemDate >= fromDate && itemDate <= toDate) {
        filterData.push(item);
      }
    }
  }

  if (filterData.length === 0) {
    logger.log('error', 'Data not found in filter order day');
    throw new AppError(StatusCodes.NOT_FOUND, 'Data not found');
  }
  return {
    filterData,
    data,
  };
};

/**
 *
 * @param email
 * @param data
 * @param amountReduced
 */

export const sendOrderMail = async (
  email?: string,
  data?: any,
  totalPrice?: number,
) => {
  if (!email) {
    throw new Error('Email không được để trống');
  }
  if (!data) {
    throw new Error('Dữ liệu đơn hàng không hợp lệ');
  }

  const subject =
    data.status === messagesSuccess.PENDING
      ? messagesSuccess.ORDER_CREATE_SUBJECT
      : messagesSuccess.ORDER_UPDATE_SUBJECT;

  const formattedTotalPayment =
    typeof totalPrice === 'number'
      ? `${totalPrice.toLocaleString('vi-VN')} VND`
      : '0 VND';

  await configSendMail({
    email: email as string,
    subject,
    text: sendOrder({ ...data, total_amount: formattedTotalPayment }),
  });
};

export const buildPaymentMethod = (method: string) => {
  try {
    switch (method) {
      case 'cash':
        // Trả về cấu trúc cho phương thức thanh toán bằng tiền mặt khi nhận hàng
        return {
          // Mô tả phương thức thanh toán
          method: 'cod',
          // Trạng thái thanh toán ban đầu là chưa thanh toán
          status: 'unpaid',
          // Thông tin thêm về loại thanh toán
          orderInfo: 'Thanh toán trực tiếp',
          // Định dạng loại đơn hàng là tiền mặt
          orderType: 'cash',
          // Mã của phương thức thanh toán tiền mặt
          partnerCode: 'TIENMAT',
        };

      case 'momo':
        // Trả về cấu trúc cho phương thức thanh toán qua ví điện tử MOMO
        return {
          // Mô tả phương thức thanh toán
          method: 'momo',
          // Trạng thái thanh toán ban đầu là chưa thanh toán
          status: 'unpaid',
          // Thông tin thêm về loại thanh toán
          orderInfo: 'Thanh toán qua MOMO',
          // Định dạng loại đơn hàng là chuyển khoản
          orderType: 'bank_transfer',
          // Mã của phương thức thanh toán MOMO
          partnerCode: 'BANKTRANSFER',
        };

      case 'vnpay':
        // Trả về cấu trúc cho phương thức thanh toán qua VNPAY
        return {
          // Mô tả phương thức thanh toán
          method: 'vnpay',
          // Trạng thái thanh toán ban đầu là chưa thanh toán
          status: 'unpaid',
          // Thông tin thêm về loại thanh toán
          orderInfo: 'Thanh toán qua VNPAY',
          // Định dạng loại đơn hàng là VNPAY
          orderType: 'vnpay',
          // Mã của phương thức thanh toán VNPAY
          partnerCode: 'VNPAY',
        };

      case 'zalopay':
        // Trả về cấu trúc cho phương thức thanh toán qua ZALOPAY
        return {
          // Mô tả phương thức thanh toán
          method: 'zalopay',
          // Trạng thái thanh toán ban đầu là chưa thanh toán
          status: 'unpaid',
          // Thông tin thêm về loại thanh toán
          orderInfo: 'Thanh toán qua ZALOPAY',
          // Định dạng loại đơn hàng là ZALOPAY
          orderType: 'zalopay',
          // Mã của phương thức thanh toán ZALOPAY
          partnerCode: 'ZALOPAY',
        };

      default:
        // Nếu `method` không hợp lệ, ném ra một lỗi
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'Phương thức thanh toán không hợp lệ',
        );
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.log('error', 'Error in build payment method in create order');
      throw new AppError(StatusCodes.BAD_REQUEST, `${error.message}`);
    }
  }
};

export const createShippingInfo = async (
  // Đối tượng đơn hàng mà chúng ta muốn cập nhật thông tin giao hàng
  order: any,
  // Địa chỉ khách hàng đã cung cấp
  address: string,
  // Địa chỉ cụ thể cho việc giao hàng (ví dụ: quận, thành phố, ...)
  shipping_address: string,
  // Phí vận chuyển cần tính thêm vào tổng giá trị đơn hàng
  transportation_fee: number,
) => {
  // Gộp `address` và `shipping_address` để tạo ra địa chỉ đầy đủ
  const detail_address = `${address},${shipping_address}`,
    // Tạo bản ghi trong bảng Shipping với địa chỉ giao hàng và phí vận chuyển
    shippingInfo = await Shipping.create({
      shipping_address: detail_address,
      transportation_fee,
    });

  // Cập nhật thông tin giao hàng cho đơn hàng bằng cách lưu `shippingInfo._id` vào trường `shipping_info` của order
  order.shipping_info = shippingInfo._id;

  // Lưu thay đổi vào cơ sở dữ liệu
  await order.save();
};

export const checkPaymentMethod = async (
  paymentMethod: any,
  inputData: any,
) => {
  // Tùy theo phương thức thanh toán (`momo`, `zalopay`, `vnpay`), gọi hàm tạo liên kết thanh toán và lưu liên kết vào `payUrl`
  let payUrl: string | undefined;

  try {
    switch (paymentMethod.method) {
      case 'momo': {
        const momoResponse: any = await createMomoService(inputData);
        return (payUrl = momoResponse?.payUrl ?? '');
      }

      case 'zalopay': {
        const zalopayResponse: any = await createZaloPayService(inputData);
        return (payUrl = zalopayResponse?.payUrl ?? '');
      }

      case 'vnpay': {
        const vnpayResponse: any = await createVnPayService(inputData);
        return (payUrl = vnpayResponse?.payUrl ?? '');
      }
      case 'cod': {
        return;
      }
      default:
        logger.log('error', 'Payment method not valid in create order');
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'Phương thức thanh toán không hợp lệ',
        ); // Nếu phương thức thanh toán không hợp lệ, trả về lỗi
    }

    // Kiểm tra nếu `payUrl` không tồn tại, trả về lỗi
    // if (!payUrl) {
    //   logger.log('error', 'Pay URL not found in create order');
    //   throw new AppError(
    //     StatusCodes.BAD_REQUEST,
    //     'Không thể lấy liên kết thanh toán từ phản hồi.',
    //   );
    // }
  } catch (error: unknown) {
    if (error instanceof AppError) {
      logger.log('error', `Catch error in check payUrl ${error.message}`);
      throw new AppError(StatusCodes.BAD_REQUEST, 'Pay URL wrong');
    }
  }
};

// Services

export const createNewOrderService = async (
  cart_id: string,
  customer_name: string,
  phone_number: string,
  shipping_address: string,
  address: string,
  payment_method: string,
  total_amount: number,
  shipping_fee: number = 50000,
  installation_fee: number,
  total: number,
  coupon: string,
  input: OrderType,
) => {
  try {
    // Tìm giỏ hàng
    const cart = await Cart.findOne({ _id: cart_id });
    if (!cart) {
      logger.log('error', 'Cart not found in create order');
      throw new AppError(StatusCodes.NOT_FOUND, 'Not found cart');
    }

    const existingOrder = await Order.findOne({ cart_id });
    if (existingOrder) {
      logger.log('error', 'Cart already exists in create new order service');
      throw new AppError(
        StatusCodes.CONFLICT,
        `Giỏ hàng này đã được sử dụng để tạo đơn hàng trước đó`,
      );
    }

    // Kiểm tra phương thức thanh toán
    const paymentMethod = buildPaymentMethod(payment_method);
    const payUrl = await checkPaymentMethod(paymentMethod, { total_amount });

    // Tạo đơn hàng
    const order = await Order.create({
      ...input,
      customer_name: customer_name,
      phone_number: phone_number,
      address: address,
      email: input.email,
      total_amount: Number(total_amount),
      payment_method: paymentMethod,
      payment_url: payUrl,
      status: input.status,
      shipping_fee: Number(shipping_fee),
    });
    if (!order) {
      logger.log('error', 'Order create error in create order');
      throw new AppError(StatusCodes.BAD_REQUEST, 'Create order error');
    }

    // Tạo chi tiết sản phẩm trong đơn hàng
    const addProductItem = async (cart: CartType, order_id: any) => {
      const products = await Promise.all(
        cart.products.map(async (product) => {
          const skuInfo = await Sku.findById(product.sku_id);
          if (!skuInfo) {
            logger.log('error', 'SKU not found in create order');
            throw new AppError(StatusCodes.NOT_FOUND, 'SKU không tồn tại');
          }
          if (product.quantity > skuInfo.stock) {
            logger.log(
              'error',
              `Không đủ hàng tồn kho cho SKU: ${skuInfo._id}`,
            );
            throw new AppError(
              StatusCodes.BAD_REQUEST,
              `Sản phẩm ${skuInfo.name} không đủ số lượng trong kho`,
            );
          }

          // Cập nhật số lượng tồn kho của SKU
          await Sku.findByIdAndUpdate(product.sku_id, {
            $inc: { stock: -product.quantity, sold: +product.quantity },
          });

          return {
            sku_id: product.sku_id,
            price: product.price,
            quantity: product.quantity,
            image: skuInfo.image,
            price_before_discount: product.price_before_discount,
            price_discount_percent: product.price_discount_percent,
            total_money: product.quantity * product.price,
          };
        }),
      );

      // Tạo một OrderDetail duy nhất chứa tất cả sản phẩm
      const newOrderDetail = await Order_Detail.create({
        order_id,
        installation_fee: installation_fee || 0, // Nếu có phí lắp đặt
        total: total || 0, // Thêm trường total vào đây
        coupon: coupon || '', // Thêm trường coupon vào đây
        products,
      });

      return newOrderDetail;
    };
    // Tạo chi tiết sản phẩm từ giỏ hàng
    const order_detail = await addProductItem(cart, order._id);

    // Đảm bảo trả lại order_details, không cần phải gọi lại addProductItem
    const new_order_details = order_detail;

    await Order.findByIdAndUpdate(
      order._id,
      {
        $set: { order_details: order_detail._id },
      },
      { new: true },
    );

    // Nếu đơn hàng có phương thức giao hàng, cập nhật thông tin giao hàng
    if (order.shipping_method === 'Shipping') {
      await createShippingInfo(order, address, shipping_address, shipping_fee);
    }

    // Xóa sản phẩm trong giỏ hàng khi tạo đơn hàng thành công
    await Cart.findOneAndUpdate(
      { cart_id: cart_id },
      { $set: { products: [], total_money: 0 } },
    );

    return { new_order_details, order };
  } catch (error) {
    logger.log('Error', 'Catch error in create new order service');
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Error in create new order service:${error}`,
    );
  }
};

export const cancelOrderService = async (id: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const ordered = await Order.findById(id);
    if (!ordered) {
      logger.log('error', 'Order not found in cancel order');
      throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
    }

    const checkStatus: { [key: string]: () => void } = {
      cancelled: () => {
        if (ordered?.status === 'cancelled') {
          logger.log('error', 'Order was cancelled in cancel order');
          throw new AppError(StatusCodes.BAD_REQUEST, 'Đơn hàng đã được hủy');
        }
      },
      delivered: () => {
        if (ordered.status === 'delivered') {
          logger.log(
            'error',
            'Order can not cancel when delivery in cancel order',
          );
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Không thể huỷ đơn hàng đang giao',
          );
        }
      },
      returned: () => {
        if (ordered.status === 'returned') {
          logger.log(
            'error',
            ' Order can not cancel when returned in cancel order',
          );
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Không thể huỷ đơn hàng đang hoàn',
          );
        }
      },
    };

    checkStatus[ordered.status as keyof typeof checkStatus]?.();

    const updateOrder = await Order.findByIdAndUpdate(
      id,
      {
        $set: { status: 'cancelled' },
        $push: {
          status_detail: {
            status: 'cancelled',
          },
        },
      },
      { new: true, session },
    ).populate({
      path: 'order_details',
      select: 'total coupon installation_fee products',
      populate: {
        path: 'products.sku_id',
        select: 'name image',
      },
    });
    if (!updateOrder) {
      logger.log('error', 'Order update failed in cancel order');
      throw new AppError(StatusCodes.BAD_REQUEST, 'Update order failed');
    }

    const checkSkuStock = async (product: {
        sku_id: string;
        quantity: number;
      }) => {
        const SKU = await Sku.findById(product.sku_id);
        if (!SKU) {
          logger.log('error', 'SKU not found in cancel order');
          throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy SKU');
        }
        // Cộng lại số lượng vào tồn kho
        const newStock = SKU.stock + product.quantity;
        const newSold = SKU.sold - product.quantity;
        return await Sku.findByIdAndUpdate(
          product.sku_id,
          {
            $set: { stock: newStock, sold: newSold },
          },
          { new: true },
        );
      },
      orderDetails = await Order_Detail.find({ order_id: id }).session(session);
    if (!orderDetails) {
      logger.log('error', 'Order detail not found in cancel order');
      throw new AppError(StatusCodes.NOT_FOUND, 'Order detail not found');
    }
    await Promise.all(
      orderDetails.map((item) => {
        item.products.map((product) => {
          checkSkuStock({
            sku_id: product.sku_id.toString(),
            quantity: product.quantity,
          });
        });
      }),
    );
    await session.commitTransaction();
    session.endSession();

    return updateOrder;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.log('Error', 'Catch error in cancel order service');
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Error in cancel order service:${error}`,
    );
  }
};

export const updateStatusOrderService = async (id: string, status: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!statusOrder.includes(status)) {
      logger.log('error', 'Status not valid in update status order');
      throw new AppError(StatusCodes.BAD_REQUEST, 'Trạng thái không hợp lệ');
    }

    const ordered = await Order.findById(id);
    if (!ordered) {
      logger.log('error', 'Not find order in update status order');
      throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
    }

    const orderDetails = await Order_Detail.find({ order_id: id }).session(
      session,
    );
    if (!orderDetails) {
      logger.log('error', 'Not find order details in update status order');
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'Không tìm thấy chi tiết đơn hàng',
      );
    }

    const check_status = ordered.status_detail?.find(
      (item) => item.status === status,
    );
    if (check_status) {
      logger.log('error', 'Status exist in update status order');
      throw new AppError(StatusCodes.BAD_REQUEST, 'Trạng thái đã tồn tại');
    }
    if (ordered?.status === status) {
      logger.log('error', 'Status can not change in update status order');
      throw new AppError(StatusCodes.BAD_REQUEST, 'Trạng thái không thay đổi');
    }

    const statusCondition: { [key: string]: () => void } = {
      cancelled: () => {
        if (ordered?.status === 'Cancelled') {
          logger.log('error', 'Order was cancelled update status order');
          throw new AppError(StatusCodes.BAD_REQUEST, 'Đơn hàng đã được hủy');
        }
      },
      delivered: () => {
        if (ordered.status === 'Delivered') {
          logger.log('error', 'Order was complete in update status order');
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Đơn hàng đã được hoàn thành',
          );
        }
        if (ordered.status !== 'Confirmed') {
          logger.log(
            'error',
            'Need confirm from customer to complete in update status order',
          );
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Đợi xác nhận từ khách hàng để hoàn thành đơn',
          );
        }
      },
      returned: () => {
        if (ordered?.status === 'Returned') {
          logger.log(
            'error',
            'Can not cancel order returned in update status order',
          );
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Không thể huỷ đơn hàng đã hoàn',
          );
        }
      },
    };

    statusCondition[status]?.();

    // if (status === 'Confirmed' && ordered.shipping_method === 'Shipping') {
    //   const shipping = await Shipping.findOne({ _id: ordered.shipping_info });
    //   if (!shipping) {
    //     logger.log(
    //       'error',
    //       'Can not find delivery info order in update status order',
    //     );
    //     throw new AppError(
    //       StatusCodes.NOT_FOUND,
    //       'Không tìm thấy thông tin giao hàng cho đơn hàng này',
    //     );
    //   }

    //   //* Find SKU info
    //   const getSKU = async (sku_id: string) => {
    //     const new_item = await Sku.findById(sku_id);
    //     if (!new_item) {
    //       logger.log('error', 'SKU ID not found in update status order');
    //       throw new AppError(
    //         StatusCodes.NOT_FOUND,
    //         `SKU with ID ${sku_id} not found`,
    //       );
    //     }
    //     return new_item;
    //   };
    //   // * Take info details
    //   const new_order_details = await Promise.all(
    //     orderDetails.map(async (item) => {
    //       const data_sku = await getSKU(item.sku_id.toString());
    //       return {
    //         _id: item._id,
    //         sku_id: data_sku._id,
    //         name: data_sku.name,
    //         price: data_sku.price,
    //         price_before_discount: data_sku.price_before_discount,
    //         price_discount_percent: data_sku.price_discount_percent,
    //         image: data_sku.image,
    //         quantity: item.quantity,
    //         total_money: item.total_money,
    //       };
    //     }),
    //   );
    //   // Tách địa chỉ giao hàng thành các phần
    //   const address_detail = shipping.shipping_address.split(',');
    //   // Const addressString = address_detail.join(',');
    //   // Const address = address_detail.shift();
    //   // Lấy phần địa chỉ chính
    //   const code_ward_district = await getAddressLocation(
    //     // Gọi hàm lấy mã phường/xã và quận/huyện từ địa chỉ
    //     address_detail.join(','),
    //   );
    //   // Kiểm tra xem có lấy được thông tin mã phường/xã và quận/huyện không
    //   if (!code_ward_district) {
    //     logger.log(
    //       'error',
    //       'Can not find district from address in update status order',
    //     );
    //     throw new AppError(
    //       StatusCodes.BAD_REQUEST,
    //       'Không thể lấy mã phường/xã và quận/huyện từ địa chỉ', // Nếu không lấy được
    //     );
    //   }

    //   // Dữ liệu để gửi đi cho API tạo đơn hàng mới
    //   const data_shipping = {
    //     to_name: ordered.customer_name,
    //     to_phone: ordered.phone_number,
    //     to_address: shipping.shipping_address,
    //     to_ward_code: code_ward_district.ward_code,
    //     // Lấy DistrictID từ district
    //     to_district_id: code_ward_district.district.DistrictID,
    //     content: ordered.content,
    //     // Ví dụ: trọng lượng của một chiếc tủ
    //     weight: 10,
    //     // Chiều dài 100 cm
    //     length: 100,
    //     // Chiều rộng 60 cm
    //     width: 90,
    //     // Chiều cao 75 cm
    //     height: 75,
    //     service_type_id: 2,
    //     service_id: 53319,
    //     payment_type_id: 1,
    //     required_note: 'CHOXEMHANGKHONGTHU',
    //     Items: new_order_details,
    //     name: 'Đồ nội thất',
    //     quantity: new_order_details.length,
    //   };

    //   //* Create new shipment order
    //   const orderCode = await createDeliveryOrderService(data_shipping);

    //   // Nếu tạo đơn hàng thành công
    //   if (orderCode.data.code === StatusCodes.OK) {
    //     // Cập nhật thông tin giao hàng với mã đơn hàng mới và thời gian giao hàng ước tính
    //     await Shipping.findByIdAndUpdate(
    //       { _id: ordered.shipping_info },
    //       {
    //         $set: {
    //           order_code: orderCode.data.data.order_code,
    //           estimated_delivery_date: orderCode.data.data.expected_delivery_time,
    //         },
    //       },
    //     );
    //   }
    // }

    // Cập nhật trạng thái đơn hàng trong cơ sở dữ liệu
    const updateOrder = await Order.findByIdAndUpdate(
      { _id: id },
      {
        // Cập nhật trạng thái đơn hàng
        $set: { status: status },

        $push: {
          status_detail: {
            // Thêm trạng thái vào danh sách status_detail
            status: status,
            // Thêm thời gian cập nhật vào status_detail
            updatedAt: new Date(),
          },
        },
      },
      // Để trả về tài liệu đã được cập nhật
      { new: true, session: session },
    ).populate({
      path: 'order_details',
      select: 'total coupon installation_fee products',
      populate: {
        path: 'products.sku_id',
        select: 'name image quantity',
      },
    });
    if (!updateOrder) {
      logger.log('error', 'Order update error in update status');
      throw new AppError(StatusCodes.BAD_REQUEST, 'Update status order error');
    }
    if (status === 'Confirmed') {
      await sendOrderMail(updateOrder.email, updateOrder, ordered.total_amount);
    }

    await session.commitTransaction();
    session.endSession();

    return updateOrder;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.log('Error', 'Catch error in update status order service');
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Error in update status order service:${error}`,
    );
  }
};

export const updatePaymentStatusOrderService = async (
  id: string,
  payment_status: string,
) => {
  // Cập nhật trạng thái đơn hàng trong cơ sở dữ liệu
  const updateOrder = await Order.findByIdAndUpdate(
    { _id: id },
    { payment_status: payment_status }, // Chỉ truyền chuỗi, không phải đối tượng
    { new: true }, // Để trả về tài liệu đã được cập nhật
  ).populate([
    {
      path: 'shipping_info',
    },
  ]);
  if (!updateOrder) {
    logger.log('error', 'Order update error in update status');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Update status order error');
  }
  // await sendOrderMail(updateOrder.email, updateOrder, ordered.total_amount);
  return updateOrder;
};

export const returnedOrderService = async (
  order_id: string,
  reason: string,
  customer_name: string,
  phone_number: string,
  images: string[],
) => {
  // Kiểm tra xem đã có yêu cầu hoàn trả cho đơn hàng này chưa
  const return_order = await Returned.findOne({ order_id });
  if (return_order) {
    logger.log('error', 'Order has request return in return order');
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Đơn hàng đã được yêu cầu hoàn hàng',
    );
  }

  // Tìm kiếm đơn hàng theo order_id
  const order = await Order.findById(order_id);
  if (!order) {
    logger.log('error', 'Order not found in return order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Đơn hàng không tìm thấy');
  }
  // Kiểm tra trạng thái đơn hàng, phải là 'delivered' để hoàn trả
  if (order.status === 'Returned' || order.status !== 'Delivered') {
    logger.log('error', 'Order status can not return in return order');
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Trạng thái đơn hàng không thể hoàn',
    );
  }

  // Tạo yêu cầu hoàn trả mới
  const returned = await Returned.create({
    order_id,
    reason,
    customer_name,
    phone_number,
    images,
  });
  if (!returned) {
    logger.log('error', 'Order return failed in return order');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Hoàn hàng không thành công');
  }
  return returned;
};

export const serviceCalFeeService = async (location: string) => {
  // Lấy thông tin địa điểm
  const code_location = await getAddressLocation(location);
  if (!code_location) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Không thể lấy thông tin địa chỉ từ vị trí đã cho',
    );
  }

  // Dữ liệu để tính phí
  const data = {
      from_district_id: 1915,
      from_ward_code: '1B2128',
      service_id: 53320,
      service_type_id: null,
      to_district_id: code_location.district.DistrictID,
      to_ward_code: code_location.ward_code,
      height: 50,
      length: 20,
      weight: 200,
      width: 20,
      insurance_value: 10000,
      cod_failed_amount: 2000,
      coupon: null,
    },
    // Tính tổng tiền vận chuyển
    total_money = await calculateFee(data as any);

  // Kiểm tra mã phản hồi
  if (total_money.code !== StatusCodes.OK) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Không thể tính phí vận chuyển',
    );
  }
  return total_money;
};

export const increaseProductFromOrderService = async (
  order_id: string,
  sku_id: string,
) => {
  // Tìm chi tiết đơn hàng tương ứng với order_id và sku_id
  const orderDetail = await Order_Detail.findOne({
    order_id: order_id,
    'products.sku_id': sku_id,
  });

  if (!orderDetail) {
    logger.log('error', 'Product not found in add one product order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy sản phẩm');
  }

  // Tìm SKU dựa trên sku_id
  const SKU = await Sku.findById(sku_id);
  if (!SKU) {
    logger.log('error', 'SKU not found in add one product order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy SKU');
  }
  const product = orderDetail.products.find(
    (p) => p.sku_id.toString() === sku_id,
  );
  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Sản phẩm không tồn tại');
  }
  // Kiểm tra nếu số lượng kho nhỏ hơn số lượng trong chi tiết đơn hàng
  if (SKU.stock <= 0) {
    logger.log('error', 'Product exceed quantity in add one product order');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Sản phẩm quá số lượng');
  }
  // Giảm số lượng kho xuống 1
  const new_stock = SKU.stock - 1;
  // Cập nhật số lượng kho trong cơ sở dữ liệu
  await Sku.findByIdAndUpdate(sku_id, {
    $set: { stock: new_stock },
  });

  // Tăng số lượng sản phẩm trong chi tiết đơn hàng
  product.quantity++;
  // Cập nhật tổng tiền dựa trên số lượng và giá
  product.total_money = product.quantity * product.price;
  // Lưu thay đổi vào cơ sở dữ liệu
  await orderDetail.save();

  // Tìm tất cả chi tiết đơn hàng dựa trên order_id
  const orderDetails = await Order_Detail.find({ order_id });
  if (!orderDetails) {
    logger.log('error', 'Order detail not found in add product order');
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Không tìm thấy đơn hàng chi tiết',
    );
  }
  // Tính tổng tiền của đơn hàng
  const total_amount = orderDetails.reduce(
      (total, amount) =>
        // Cộng tổng tiền, nếu không có thì tính là 0
        total + (amount.total ?? 0),
      0,
    ),
    // Cập nhật tổng tiền cho đơn hàng
    newOrder = await Order.findByIdAndUpdate(
      order_id,
      {
        // Cập nhật tổng tiền
        $set: { total_amount },
      },
      // Trả về tài liệu đã cập nhật
      { new: true },
    );
  if (!newOrder) {
    logger.log(
      'error',
      'Order total price can not update in add product order',
    );
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Order error when update total price',
    );
  }
  return newOrder;
};

export const decreaseProductFromOrderService = async (
  order_id: string,
  sku_id: string,
) => {
  // Tìm chi tiết đơn hàng tương ứng với order_id và sku_id
  const orderDetail = await Order_Detail.findOne({
    order_id,
    'products.sku_id': sku_id,
  });
  if (!orderDetail) {
    logger.log('error', 'Order detail not found in delete product order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy sản phẩm');
  }

  const product = orderDetail.products.find(
    (p) => p.sku_id.toString() === sku_id,
  );
  if (!product) {
    logger.error('Product not found in order details');
    throw new AppError(StatusCodes.NOT_FOUND, 'Sản phẩm không tồn tại');
  }

  // Kiểm tra số lượng sản phẩm
  if (product.quantity <= 1) {
    logger.log(
      'error',
      'Order detail have at least one product in delete product order',
    );
    throw new AppError(StatusCodes.BAD_REQUEST, 'Ít nhất là 1 sản phẩm');
  }

  // Tìm SKU dựa trên sku_id
  const SKU = await Sku.findById(sku_id);
  if (!SKU) {
    logger.log('error', 'SKU not found in delete product order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy SKU');
  }

  // Tăng số lượng kho lên 1
  const new_stock = SKU.stock + 1;
  // Cập nhật số lượng kho trong cơ sở dữ liệu
  await Sku.findByIdAndUpdate(sku_id, {
    $set: { stock: new_stock },
  });

  // Giảm số lượng sản phẩm trong chi tiết đơn hàng
  product.quantity--;
  // Cập nhật tổng tiền dựa trên số lượng và giá
  product.total_money = product.quantity * product.price;
  // Lưu thay đổi vào cơ sở dữ liệu
  await orderDetail.save();

  // Tìm tất cả chi tiết đơn hàng dựa trên order_id
  const orderDetails = await Order_Detail.find({ order_id });
  if (!orderDetails) {
    logger.log('error', 'Order details not found in delete product order');
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Không tìm thấy chi tiết sản phẩm',
    );
  }
  // Tính tổng tiền của đơn hàng
  const total_amount = orderDetails.reduce(
      (total, amount) => total + (amount.total ?? 0),
      0,
    ),
    // Cập nhật tổng tiền cho đơn hàng
    newUpdateOrder = await Order.findByIdAndUpdate(
      order_id,
      {
        // Cập nhật tổng tiền
        $set: { total_amount },
      },
      // Trả về tài liệu đã cập nhật
      { new: true },
    );
  if (!newUpdateOrder) {
    logger.log('error', 'Order update failed in delete product order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Order update failed');
  }
  return newUpdateOrder;
};

export const getOrderByPhoneNumberService = async (
  conditions: object,
  options: object,
) => {
  // Tìm kiếm và phân trang dữ liệu
  const orders = await Order.paginate(conditions, options);

  // Xử lý khi không tìm thấy đơn hàng
  if (!orders.length) {
    logger.log('error', 'Order not found in get one by phone number order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
  }

  // Lấy chi tiết từng đơn hàng trong danh sách kết quả
  const orderDetailsPromises = orders.docs.map(async (result) => {
      const orderDetails = await Order_Detail.find({
        order_id: result._id,
      }).populate({
        path: 'products.sku_id',
        select: 'name image',
      }); // Lấy chi tiết đơn hàng
      if (!orderDetails) {
        logger.log(
          'error',
          'Order detail not found in get one by phone number order',
        );
        throw new AppError(
          StatusCodes.NOT_FOUND,
          'Không tìm thấy đơn hàng chi tiết',
        );
      }
      const newOrder = await Promise.all(
        orderDetails.map(async (item) => {
          const sku = await Sku.findOne({
              _id: item.products[0].sku_id,
            }).select(
              // Lấy tên, URL chia sẻ và hình ảnh
              'name image',
            ),
            newSku = sku?.toObject();
          return {
            ...item.toObject(),
            // Kết hợp chi tiết đơn hàng với thông tin sản phẩm (SKU)
            ...newSku,
          };
        }),
      );
      return {
        ...result.toObject(),
        // Đính kèm danh sách chi tiết sản phẩm vào đơn hàng
        orders: newOrder,
      };
    }),
    // Hoàn thành xử lý chi tiết từng đơn hàng
    ordersWithDetails = await Promise.all(orderDetailsPromises);
  if (!ordersWithDetails) {
    logger.log('error', 'Order details error in get one by phone number order');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Error when search detail');
  }
  // Trả về phản hồi JSON với danh sách đơn hàng và thông tin phân trang
  return { ordersWithDetails, orders };
};

export const getOrderByUserIdService = async (
  conditions: object,
  options: object,
) => {
  // Tìm kiếm đơn hàng
  const order = await Order.paginate(conditions, options);
  if (!order || order.length === 0) {
    logger.log('error', 'Order not found in get one by user id order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
  }

  // Tìm kiếm chi tiết đơn hàng
  const orderDetailsPromises = order.docs.map(async (item) => {
    const orderDetails = await Order_Detail.find({
      order_id: item._id,
    }).lean(); // Sử dụng lean() để trả về plain JavaScript objects

    if (!orderDetails) {
      logger.log('error', 'Order detail not found in get one by user id order');
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'Không tìm thấy đơn hàng chi tiết',
      );
    }

    // Lấy thông tin sản phẩm và chi tiết SKU
    const updatedProducts = await Promise.all(
      orderDetails.map(async (detail) => {
        return {
          ...detail,
          products: await Promise.all(
            detail.products.map(async (product) => {
              // Lấy chi tiết SKU
              const sku = await Sku.findOne({ _id: product.sku_id })
                .select('name image')
                .lean(); // Chuyển sang plain object
              return {
                ...product, // Thông tin sản phẩm hiện tại
                sku_id: sku || {}, // Gắn thông tin chi tiết SKU (hoặc rỗng nếu không tìm thấy)
              };
            }),
          ),
        };
      }),
    );

    return {
      ...item.toObject(), // Chuyển đổi thông tin đơn hàng thành plain object
      order_details: updatedProducts, // Đính kèm thông tin sản phẩm đã được cập nhật
    };
  });

  const ordersWithDetails = await Promise.all(orderDetailsPromises);
  if (!ordersWithDetails) {
    logger.log('error', 'Order details error in get one by user id order');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Error when search detail');
  }

  return { ordersWithDetails, order };
};

export const getAllOrdersService = async (
  conditions: object,
  options: object,
) => {
  // Thực hiện truy vấn và phân trang
  const orders = await Order.paginate(conditions, options);
  if (!orders || orders.length === 0) {
    logger.log('error', 'Can not find order in get all order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Can not find order');
  }

  // Lấy chi tiết cho từng đơn hàng
  const new_docs = await Promise.all(
    orders.docs.map(async (item: OrderType) => {
      const order_details = await Order_Detail.find({
          order_id: item._id,
        }).populate({
          path: 'products.sku_id',
          select: 'name image SKU',
        }), // Lấy chi tiết sản phẩm của đơn hàng
        // Chuyển đổi đơn hàng sang đối tượng
        orders = item.toObject();
      return {
        // Kết hợp các trường của đơn hàng
        ...orders,
        // Thêm thông tin sản phẩm vào đơn hàng
        products: order_details,
      };
    }),
  );
  return { new_docs, orders };
};

export const getAllUserOrdersService = async () => {
  // Lấy tất cả đơn hàng từ cơ sở dữ liệu
  const orders = await Order.find();
  if (!orders) {
    logger.log('error', 'Order not found in get all order');
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Không tìm thấy sản phẩm trong đơn hàng',
    );
  }
  // Sử dụng Promise.all để lấy chi tiết sản phẩm cho mỗi đơn hàng
  const new_docs = await Promise.all(
      orders.map(async (item) => {
        // Tìm chi tiết sản phẩm dựa trên order_id
        const order_details = await Order_Detail.find({
            order_id: item._id,
          }).populate({
            path: 'products.sku_id',
            select: 'name image SKU',
          }),
          // Chuyển đổi đơn hàng sang đối tượng thông thường
          order = item.toObject();
        // Trả về đơn hàng cùng với thông tin sản phẩm
        return {
          ...order,
          products: order_details,
        };
      }),
    ),
    // Tính tổng số đơn hàng
    total_order = new_docs.length,
    // Tạo mảng các tên khách hàng duy nhất
    uniqueCustomers = [...new Set(new_docs.map((item) => item.customer_name))],
    // Tính số lượng khách hàng duy nhất
    total_user = uniqueCustomers.length,
    // Tính tổng số tiền từ tất cả các đơn hàng
    total_order_money = new_docs
      .reduce((total, item) => total + item.total_amount, 0) // Tính tổng số tiền
      .toLocaleString(), // Định dạng thành chuỗi với dấu phân cách số
    // Tính tổng số sản phẩm trong tất cả các đơn hàng
    total_order_product = new_docs.reduce(
      (total, item) => total + item.products.length,
      0,
    );
  return {
    // Tổng số đơn hàng
    total_order,
    // Tổng số khách hàng duy nhất
    total_user,
    // Tổng số tiền
    total_order_money,
    // Tổng số sản phẩm
    total_order_product,
    // Danh sách đơn hàng đã lấy
    new_docs,
  };
};

export const getOneOrderService = async (id: string) => {
  const order = await Order.findById(id)
    .populate({
      path: 'order_details',
      select: 'total coupon installation_fee products',
      populate: {
        path: 'products.sku_id',
        select: 'name image',
      },
    })
    .exec();
  if (!order) {
    logger.log('error', 'Order not found in get one status');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Order not exist');
  }
  return order;
};

export const updatePaymentStatusService = async (
  _id: string,
  orderInfo: string,
) => {
  // Cập nhật trạng thái thanh toán cho đơn hàng
  const order = await Order.findByIdAndUpdate(_id, {
    $set: {
      // Cập nhật trạng thái thanh toán thành "paid"
      payment_status: 'paid',
      // Cập nhật phương thức thanh toán với thông tin từ orderInfo
      payment_method: orderInfo,
    },
  });
  if (!order) {
    logger.log('error', 'Order not found in update payment status');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
  }
  return;
};

export const removeProductFromOrderService = async (
  order_id: string,
  sku_id: string,
) => {
  // Tìm và xóa chi tiết đơn hàng theo order_id và sku_id
  const orderDetail = await Order_Detail.findOneAndDelete({
    $and: [{ order_id }, { sku_id }],
  });

  if (!orderDetail) {
    logger.log('error', 'Order detail not found in delete product from order');
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Không tìm thấy sản phẩm trong đơn hàng',
    );
  }

  // Lấy tất cả chi tiết đơn hàng còn lại cho order_id
  const orderDetails = await Order_Detail.find({ order_id });
  if (!orderDetails) {
    logger.log('error', 'Order details not found in delete product from order');
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Không tìm thấy sản phẩm trong đơn hàng',
    );
  }
  // Tính tổng số tiền mới cho đơn hàng
  const total_amount = orderDetails.reduce(
      (total, amount) =>
        // Đảm bảo tổng tiền không bị undefined
        total + (amount.total ?? 0),
      0,
    ),
    // Cập nhật tổng số tiền trong đơn hàng
    newUpdateOrder = await Order.findByIdAndUpdate(
      order_id,
      {
        $set: {
          total_amount,
        },
      },
      { new: true },
    );
  if (!newUpdateOrder) {
    logger.log('error', 'Order update failed in delete product from order');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Order update failed');
  }
  return newUpdateOrder;
};

export const getReturnedOrderService = async (
  // Trang hiện tại (mặc định là 1)
  _page: number | string = 1,
  // Trường để sắp xếp (mặc định là created_at)
  _sort: string = 'createdAt',
  // Thứ tự sắp xếp (mặc định là giảm dần)
  _order: string = 'desc',
  // Số lượng yêu cầu trả về trên một trang (mặc định là 10)
  _limit: number | string = 100,
  // Tìm kiếm theo tên khách hàng
  search: string | undefined,
  // Tình trạng xác nhận
  is_confirm: boolean | undefined,
  // Ngày để tìm kiếm
  date: string | undefined,
) => {
  const conditions: Record<string, any> = {};

  // Thêm điều kiện tìm kiếm theo tên khách hàng
  if (search) {
    conditions.$or = [
      { customer_name: { $regex: new RegExp(search, 'i') } },
      { order_id: search }, // Tìm kiếm chính xác theo `order_id`
    ];
  }

  // Thêm điều kiện xác nhận
  if (is_confirm) {
    conditions.is_confirm = is_confirm;
  }

  // Thêm điều kiện theo ngày
  if (date) {
    // Chuyển đổi chuỗi ngày thành đối tượng moment
    const { years, months, date: day } = moment(date).toObject();
    // Đặt điều kiện tìm kiếm theo khoảng thời gian
    conditions.created_at = {
      // Ngày bắt đầu
      $gte: new Date(years, months + 1, day),
      // Ngày kết thúc
      $lt: new Date(years, months + 1, day + 1),
    };
  }

  // Tùy chọn cho truy vấn phân trang
  const options = {
      page: Number(_page) || 1,
      limit: Number(_limit) || 10,
      sort: {
        // Sắp xếp theo trường và thứ tự
        [_sort]: _order === 'desc' ? -1 : 1,
      },
      // Chọn các trường để trả về
      select: ['-deleted', '-deleted_at'],
    },
    // Lấy danh sách yêu cầu hoàn trả từ cơ sở dữ liệu
    orders = await Returned.paginate(conditions, options);
  return { orders };
};

export const updateStatusDeliveredService = async (id: string) => {
  const ordered = await Order.findById(id);
  if (!ordered) {
    logger.log('error', 'Order not found in update status deliveried');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
  }

  // Kiểm tra trạng thái đơn hàng
  if (ordered.status !== 'pendingComplete') {
    logger.log('error', 'Order status not valid in update status deliveried');
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Trạng thái đơn hàng không hợp lệ',
    );
  }

  const updateOrder = await Order.findByIdAndUpdate(
    id,
    {
      $set: { status: 'delivered', payment_status: 'paid' },
      $push: {
        status_detail: {
          status: 'delivered',
        },
      },
    },
    { new: true },
  );
  if (!updateOrder) {
    logger.log(
      'error',
      'Order status update failed in update status deliveried',
    );
    throw new AppError(StatusCodes.BAD_REQUEST, 'Update order failed');
  }
  return updateOrder;
};

export const confirmReturnedOrderService = async (id: string) => {
  const returned = await Returned.findByIdAndUpdate(
    id,
    {
      $set: {
        is_confirm: true,
      },
    },
    { new: true },
  );

  if (!returned) {
    logger.log('error', 'Returned update failed in confirm return order');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Không tìm thấy đơn hàng');
  }

  const orderUpdate = await Order.findByIdAndUpdate(
    returned.order_id,
    {
      $set: { status: 'Returned' },
      $push: {
        status_detail: {
          status: 'Returned',
        },
      },
    },
    { new: true },
  );
  if (!orderUpdate) {
    logger.log('error', 'Order update failed in confirm return order');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Không tìm thấy đơn hàng');
  }

  const checkSKUStock = async (product: {
    sku_id: string;
    quantity: number;
  }) => {
    const SKU = await Sku.findById(product.sku_id);
    if (!SKU) {
      logger.log(
        'error',
        `SKU not found in confirm return order for sku_id: ${product.sku_id}`,
      );
      throw new AppError(
        StatusCodes.NOT_FOUND,
        `Không tìm thấy SKU với ID: ${product.sku_id}`,
      );
    }
    // Tăng số lượng tồn kho cho sản phẩm
    const new_stock = SKU.stock + product.quantity;
    await Sku.findByIdAndUpdate(product.sku_id, {
      $set: {
        stock: new_stock,
      },
    });
  };

  const orderItems = await Order_Detail.find({
    order_id: returned.order_id,
  }).select('sku_id quantity products');
  console.log('Order Items:', orderItems);
  if (!orderItems || !Array.isArray(orderItems)) {
    logger.log(
      'error',
      'Order detail not found or not an array in confirm return order',
    );
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Không tìm thấy đơn hàng chi tiết',
    );
  }

  await Promise.all(
    orderItems.map((item) => {
      // Kiểm tra item.products có phải là mảng không trước khi gọi map
      if (item.products && Array.isArray(item.products)) {
        return Promise.all(
          item.products.map((product) => {
            return checkSKUStock({
              sku_id: product.sku_id.toString(),
              quantity: product.quantity,
            });
          }),
        );
      } else {
        // Nếu item.products không phải là mảng hoặc bị thiếu
        logger.log('error', 'Item products is not an array or is missing');
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'Dữ liệu sản phẩm không hợp lệ trong đơn hàng chi tiết',
        );
      }
    }),
  );

  return;
};

export const updateInfoCustomerService = async (
  id: string,
  // Tên khách hàng
  customer_name: string,
  // Số điện thoại khách hàng
  phone_number: string,
  // Nội dung đơn hàng
  content: string,
  // Địa chỉ giao hàng
  shippingAddress: string,
  // Phí vận chuyển
  transportation_fee: number,
) => {
  // Tìm kiếm đơn hàng bằng ID và lấy thông tin vận chuyển
  const order = await Order.findById(id).populate({
    path: 'shipping_info',
  });
  if (!order) {
    logger.log('error', 'Order not found in update info customer');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
  }

  // Kiểm tra trạng thái đơn hàng để xác định xem có thể sửa đổi không
  if (
    // Nếu đơn hàng đã bị hủy
    order.status === 'cancelled' ||
    // Nếu đơn hàng đang được giao
    order.status === 'delivering' ||
    // Nếu đơn hàng đã được giao
    order.status === 'delivered'
  ) {
    logger.log('error', 'Order can not fix in update info customer');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Không thể sửa đơn hàng');
  }

  // Cập nhật thông tin vận chuyển nếu đơn hàng đã được giao ("shipped")
  if (order.shipping_method === 'Shipping' && order.shipping_info?._id) {
    await Shipping.findByIdAndUpdate(
      // ID thông tin vận chuyển
      order.shipping_info._id,
      {
        $set: {
          // Cập nhật địa chỉ giao hàng
          shipping_address: shippingAddress,
          // Cập nhật phí vận chuyển
          transportation_fee,
        },
      },
      { new: true },
    );
  }

  // Cập nhật thông tin khách hàng trong đơn hàng
  const updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      $set: {
        // Cập nhật tên khách hàng
        customer_name,
        // Cập nhật số điện thoại
        phone_number,
        // Cập nhật nội dung
        content,
      },
    },
    { new: true },
  );
  if (updatedOrder) {
    logger.log('error', 'Order update failed in update info customer');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Order update failed');
  }
  return updatedOrder;
};

export const getAllShippingService = async (
  // Trang hiện tại, mặc định là 1
  _page: number = 1,
  // Trường để sắp xếp, mặc định là createdAt
  _sort: string = 'createdAt',
  // Thứ tự sắp xếp, mặc định là tăng dần
  _order: string = 'asc',
  // Số lượng bản ghi mỗi trang, mặc định là 10
  _limit: number = 10,
  customer_name?: string,
) => {
  const options: PaginateOptions = {
    // Trang hiện tại
    page: _page,
    // Số lượng bản ghi mỗi trang
    limit: _limit,
    sort: {
      // Sắp xếp theo thứ tự giảm dần hoặc tăng dần
      [_sort]: _order === 'desc' ? -1 : 1,
    },
  };
  const query = {
    shipping_method: 'shipped',
    ...(customer_name && {
      customer_name: { $regex: customer_name, $options: 'i' },
    }),
  };

  const orders = await Order.paginate(query, options);
  if (!orders.length) {
    logger.log('error', 'Can not find order in get all shipping');
    throw new AppError(StatusCodes.NOT_FOUND, 'Can not find order');
  }
  // Lấy chi tiết đơn hàng cho từng đơn hàng đã tìm thấy
  const newDocs = await Promise.all(
    orders.docs.map(async (item) => {
      // Tìm chi tiết đơn hàng
      const order_details = await Order_Detail.find({ order_id: item._id }),
        // Chuyển đổi tài liệu thành đối tượng JS
        orders = item.toObject();
      return {
        // Giữ nguyên thông tin đơn hàng
        ...orders,
        // Thêm danh sách sản phẩm vào đơn hàng
        products: order_details,
      };
    }),
  );
  return { newDocs, orders };
};

export const getTokenPrintBillsService = async (order_id: string) => {
  // Tìm đơn hàng theo order_id và lấy thông tin shipping_info
  const order = await Order.findById(order_id).populate('shipping_info');
  if (!order) {
    // Nếu không tìm thấy đơn hàng, ném lỗi NotFound
    logger.log('error', 'Can not find order in get token print bills');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
  }

  if (order.shipping_method === 'In-store') {
    logger.log('error', 'Order was buy in store in get token print bills');
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Đơn hàng này mua tại cửa hàng',
    );
  }

  // Kiểm tra trạng thái đơn hàng và phương thức giao hàng
  if (order.status === 'processing' && order.shipping_method === 'Shipping') {
    // Tìm thông tin giao hàng tương ứng với đơn hàng
    const shipping = await Shipping.findById(order.shipping_info?._id);
    if (!shipping) {
      logger.log('error', 'Shipping info not found in get token print bills');
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'Không tìm thấy thông tin giao hàng',
      );
    }

    // Lấy danh sách chi tiết đơn hàng
    const order_details = await Order_Detail.find({ order_id }),
      new_order_details = await Promise.all(
        order_details.map(async (item) => {
          const data_sku = await Sku.findById(item.products[0].sku_id);
          if (!data_sku) {
            logger.log('error', 'SKU not found in get token print bills');
            throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy SKU');
          }

          // Trả về thông tin chi tiết của sản phẩm
          return {
            _id: item._id,
            sku_id: data_sku._id,
            name: data_sku.name,
            price: data_sku.price,
            price_before_discount: data_sku.price_before_discount,
            price_discount_percent: data_sku.price_discount_percent,
            image: data_sku.image,
            quantity: item.products[0].quantity,
            total_money: item.products[0].total_money,
          };
        }),
      ),
      // Tách địa chỉ giao hàng thành các phần
      address_detail = shipping.shipping_address.split(','),
      // Const address = address_detail.shift(); // Lấy địa chỉ chính
      // Lấy mã phường và quận từ địa chỉ chi tiết
      code_ward_district = await getAddressLocation(address_detail.join(',')),
      // Chuẩn bị dữ liệu để tạo mã vận đơn
      data_shipping = {
        to_name: order.customer_name,
        to_phone: order.phone_number.toString(),
        to_address: shipping.shipping_address,
        to_ward_code: code_ward_district?.ward_code,
        to_district_id: code_ward_district?.district.DistrictID,
        content: order.content,
        // Trọng lượng (gram)
        weight: 1000,
        // Chiều dài (cm)
        length: 15,
        // Chiều rộng (cm)
        width: 15,
        // Chiều cao (cm)
        height: 15,
        // Loại dịch vụ
        service_type_id: 2,
        // ID dịch vụ
        service_id: 53319,
        // Loại hình thanh toán
        payment_type_id: 1,
        // Ghi chú yêu cầu
        required_note: 'CHOXEMHANGKHONGTHU',
        // Danh sách sản phẩm
        Items: new_order_details,
        // Tên sản phẩm chung
        name: 'Đồ điện tử',
        // Số lượng sản phẩm
        quantity: new_order_details.length,
      },
      // Gửi yêu cầu tạo mã vận đơn đến API GHN
      orderCode = await createDeliveryOrderService(data_shipping);

    // Kiểm tra mã phản hồi từ API
    if (orderCode.data.code === StatusCodes.OK) {
      // Nếu thành công, cập nhật thông tin mã vận đơn vào cơ sở dữ liệu
      await Shipping.findByIdAndUpdate(order.shipping_info?._id, {
        $set: {
          order_code: orderCode.data.data.order_code, // Mã vận đơn
          estimated_delivery_date: orderCode.data.data.expected_delivery_time, // Thời gian dự kiến giao hàng
        },
      });
    } else {
      logger.log('error', 'Order code can not create in get token print bills');
      throw new AppError(StatusCodes.BAD_REQUEST, 'Không thể tạo mã vận đơn');
    }
  }

  // Lấy thông tin giao hàng để lấy token hóa đơn
  const shipping = await Shipping.findById(order.shipping_info?._id);
  if (!shipping) {
    logger.log('error', 'Shipping not found in get token print bills');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Shipping info not found');
  }
  const token_bill = await getTokenPrintBill(shipping?.order_code ?? '');
  if (!token_bill) {
    logger.log('error', 'Token print bill get failed in get token print bills');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Token print bill get failed');
  }
  // Kiểm tra mã phản hồi từ việc lấy token hóa đơn
  if (token_bill.code !== StatusCodes.OK) {
    logger.log('error', 'Token print bill not found in get token print bills');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Không tìm thấy token hoá đơn');
  }
  return token_bill;
};
