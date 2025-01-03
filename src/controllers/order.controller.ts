import { messagesSuccess } from '@/constants/messages';
import Notification from '@/models/Notification';
import {
  cancelOrderService,
  cancelReturnedOrderService,
  confirmRefundedOrderService,
  confirmReturnedOrderService,
  createNewOrderService,
  decreaseProductFromOrderService,
  getAllOrdersService,
  getAllShippingService,
  getAllUserOrdersService,
  getOneOrderService,
  getOrderByPhoneNumberService,
  getOrderByUserIdService,
  getRefundedOrderService,
  getReturnedOrderService,
  getTokenPrintBillsService,
  increaseProductFromOrderService,
  refundedOrderService,
  removeProductFromOrderService,
  returnedOrderService,
  serviceCalFeeService,
  updateInfoCustomerService,
  updatePaymentStatusOrderService,
  updatePaymentStatusService,
  updateStatusDeliveredService,
  updateStatusOrderService,
} from '@/services/order.service';
import logger from '@/utils/logger';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

// Controllers
export const createNewOrder: RequestHandler = async (req, res, next) => {
  const {
    address,
    shipping_address,
    payment_method,
    total_amount,
    shipping_fee = 50000,
    phone_number,
    customer_name,
    installation_fee,
    total,
    coupon,
    // GuestId,
    cart_id,
    ...body
  } = req.body;
  try {
    //* Find cart exists
    const { order, new_order_details } = await createNewOrderService(
      cart_id,
      customer_name,
      phone_number,
      shipping_address,
      address,
      payment_method,
      total_amount,
      shipping_fee,
      installation_fee,
      total,
      coupon,
      body,
    );

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CREATE_ORDER_SUCCESS,
      res: {
        ...order.toObject(),
        products: new_order_details,
        payment_method: order.payment_method,
        payment_url: order.payment_url,
      },
    });
  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error);
    logger.log('error', `Catch error in create order: ${error}`);
    next(error);
  }
};

// Cập nhật trạng thái của một đơn hàng
export const updateStatusOrder: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updateOrder = await updateStatusOrderService(id, status);

    if (
      updateOrder.status === 'Confirmed' ||
      updateOrder.status === 'Completed' ||
      updateOrder.status === 'Delivered'
    ) {
      const io: Server = req.app.get('io');
      // Lưu thông báo vào cơ sở dữ liệu
      const notification = new Notification({
        userId: updateOrder.user_id, // ID của người nhận thông báo (có thể là admin hoặc người dùng)
        orderId: id,
        status: status,
      });
      await notification.save();
      io.emit('orderUpdated', {
        orderId: id,
        orderData: updateOrder,
        message: notification,
      });
    }

    res.status(StatusCodes.CREATED).json({
      message: 'Order update successfully',
      res: updateOrder,
    });
  } catch (error) {
    logger.log('error', `Catch error in get update status ${error}`);
    next(error);
  }
};
// Cập nhật trạng  thanh toán của một đơn hàng
export const updatePaymentStatusOrder: RequestHandler = async (
  req,
  res,
  next,
) => {
  const { id } = req.params;
  const { payment_status } = req.body;
  try {
    const updateOrder = await updatePaymentStatusOrderService(
      id,
      payment_status,
    );
    res.status(StatusCodes.CREATED).json({
      message: 'Order update successfully',
      res: updateOrder,
    });
  } catch (error) {
    logger.log('error', `Catch error in get update status ${error}`);
    next(error);
  }
};
// Hàm xử lý yêu cầu hoàn trả đơn hàng
export const returnedOrder: RequestHandler = async (req, res, next) => {
  const { order_id, reason, customer_name, phone_number, images } =
    req.body as {
      // ID của đơn hàng
      order_id: string;
      // Lý do hoàn trả
      reason: string;
      // Tên khách hàng
      customer_name: string;
      // Số điện thoại của khách hàng
      phone_number: string;
      // Hình ảnh chứng minh yêu cầu hoàn trả
      images: string[];
    };
  try {
    const returned = await returnedOrderService(
      order_id,
      reason,
      customer_name,
      phone_number,
      images,
    );

    return res.status(StatusCodes.OK).json({
      message: 'Tạo yêu cầu hoàn hàng thành công',
      res: returned,
    });
  } catch (error) {
    logger.log('error', `Catch error in return order: ${error}`);
    next(error);
  }
};
// Hàm xử lý yêu cầu hoàn tiền đơn hàng
export const refundedOrder: RequestHandler = async (req, res, next) => {
  const {
    order_id,
    bank_number,
    bank_name,
    customer_name,
    phone_number,
    images,
  } = req.body as {
    // ID của đơn hàng
    order_id: string;
    // Lý do hoàn trả
    bank_number: number;
    // Tên ngân hàng
    bank_name: string;
    // Tên khách hàng
    customer_name: string;
    // Số điện thoại của khách hàng
    phone_number: string;
    // Hình ảnh chứng minh yêu cầu hoàn trả
    images: string[];
  };
  try {
    const returned = await refundedOrderService(
      order_id,
      bank_number,
      bank_name,
      customer_name,
      phone_number,
      images,
    );

    return res.status(StatusCodes.OK).json({
      message: 'Tạo yêu cầu hoàn tiền thành công',
      res: returned,
    });
  } catch (error) {
    logger.log('error', `Catch error in return order: ${error}`);
    next(error);
  }
};
// Tính tiền vận chuyển
export const serviceCalFee: RequestHandler = async (req, res, next) => {
  const { location } = req.body;
  try {
    const totalMoney = await serviceCalFeeService(location);
    return res.status(StatusCodes.OK).json({
      message: 'thành công',
      res: totalMoney.data.total,
    });
  } catch (error) {
    logger.log('error', `Catch error in service fee: ${error}`);
    next(error);
  }
};

// Hàm xử lý yêu cầu thêm sản phẩm vào đơn hàng
export const increaseProductFromOrder: RequestHandler = async (
  req,
  res,
  next,
) => {
  const { order_id, sku_id } = req.body;
  try {
    const newOrder = await increaseProductFromOrderService(order_id, sku_id);
    return res.status(StatusCodes.OK).json({
      message: 'Cập nhật thành công',
      res: newOrder,
    });
  } catch (error) {
    logger.log('error', `Catch error in add product order: ${error}`);
    next(error);
  }
};

// Hàm xử lý yêu cầu tìm đơn hàng theo sdt
export const getOrderByPhoneNumber: RequestHandler = async (req, res, next) => {
  // 1. Lấy các tham số truy vấn và thiết lập các giá trị mặc định nếu không có
  // Trang hiện tại
  const _page = parseInt(req.query._page as string) || 1,
    // Tiêu chí sắp xếp
    _sort = (req.query._sort as string) || 'created_at',
    // Thứ tự sắp xếp
    _order = (req.query._order as string) || 'desc',
    // Số lượng bản ghi mỗi trang
    _limit = parseInt(req.query._limit as string) || 6,
    // Từ khóa tìm kiếm
    search = req.query.search as string,
    // Số điện thoại
    phone_number = req.body.phone_number as string,
    // 2. Xác định thứ tự sắp xếp (1: tăng dần, -1: giảm dần)
    orderDirection = _order === 'desc' ? -1 : 1,
    // 3. Điều kiện lọc
    conditions: Record<string, any> = {};
  if (search) {
    conditions.customer_name = { $regex: new RegExp(search, 'i') }; // Tìm kiếm theo tên khách hàng (không phân biệt hoa thường)
  }
  if (phone_number) {
    conditions.phone_number = phone_number; // Lọc theo số điện thoại
  }

  // 4. Tùy chọn phân trang
  const options = {
    page: _page,
    limit: _limit,
    sort: { [_sort]: orderDirection },
    select: ['-deleted', '-deleted_at'],
  };
  try {
    // 5. Tìm kiếm và phân trang dữ liệu
    const { orders, ordersWithDetails } = await getOrderByPhoneNumberService(
      conditions,
      options,
    );
    return res.status(StatusCodes.OK).json({
      message: 'Lấy toàn bộ sản phẩm thành công',
      res: {
        items: ordersWithDetails,
        paginate: orders,
      },
    });
  } catch (error) {
    logger.log(
      'error',
      `Catch error in get order by phone number order: ${error}`,
    );
    next(error);
  }
};

// Hàm xử lý yêu cầu tìm đơn hàng theo user
export const getOrderByUserId: RequestHandler = async (req, res, next) => {
  const {
      _page = 1,
      _sort = 'created_at',
      _order = 'desc',
      _limit = 100,
      status,
      id,
    } = req.query,
    conditions: Record<string, any> = {};
  if (status) {
    conditions.status = status;
  }
  if (id) {
    conditions.user_id = id;
  }

  // Thiết lập tùy chọn cho phân trang
  const options = {
    page: parseInt(_page as string),
    limit: parseInt(_limit as string),
    sort: {
      [String(_sort)]: _order === 'desc' ? -1 : 1,
    },
    select: ['-deleted', '-deleted_at'],
  };
  try {
    // Tìm kiếm đơn hàng
    const { order, ordersWithDetails } = await getOrderByUserIdService(
      conditions,
      options,
    );
    return res.status(StatusCodes.OK).json({
      message: 'Tìm thấy đơn hàng thành công',
      res: {
        items: ordersWithDetails,
        paginate: order,
      },
    });
  } catch (error) {
    logger.log('error', `Catch error in get order by user id order: ${error}`);
    next(error);
  }
};

// Lấy danh sách đơn hàng với các tùy chọn tìm kiếm, sắp xếp và phân trang.
export const getAllOrders: RequestHandler = async (req, res, next) => {
  const {
    _page = '1',
    _sort = 'createdAt',
    _order = 'desc',
    _limit = '100', // Giới hạn mặc định là 100
    search,
    status,
    date,
    payment_method,
    payment_status,
  } = req.query;

  // Chuyển đổi _limit thành số
  const limit = typeof _limit === 'string' ? parseInt(_limit, 10) : 10; // Nếu _limit là chuỗi, chuyển thành số

  const sortField = typeof _sort === 'string' ? _sort : 'created_at';
  const conditions: any = {};

  // Các điều kiện tìm kiếm
  if (search && typeof search === 'string') {
    conditions.$or = [
      { customer_name: { $regex: new RegExp(search, 'i') } },
      {
        _id: mongoose.Types.ObjectId.isValid(search)
          ? new mongoose.Types.ObjectId(search)
          : null,
      },
    ];
  }

  if (status) conditions.status = status;
  if (payment_status) conditions.payment_status = payment_status;
  if (date && typeof date === 'string') {
    const { years, months, date: day } = moment(date).toObject();
    conditions.created_at = {
      $gte: new Date(years, months + 1, day),
      $lt: new Date(years, months + 1, day + 1),
    };
  }

  if (payment_method) conditions['payment_method.partnerCode'] = payment_method;

  // Cập nhật options cho truy vấn
  const options = {
    page: _page, // Trang hiện tại
    limit: limit, // Giới hạn hoặc số lượng bản ghi cần lấy
    sort: { [sortField]: _order === 'desc' ? -1 : 1 },
    select: ['-deleted', '-deleted_at'], // Lọc các trường không cần thiết
  };

  try {
    const { orders, new_docs } = await getAllOrdersService(conditions, options);
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_PRODUCT_SUCCESS,
      res: {
        items: new_docs,
        paginate: orders,
      },
    });
  } catch (error) {
    logger.log('error', `Catch error in get all order: ${error}`);
    next(error);
  }
};

// Lấy tất cả đơn hàng cho khách đã đăng nhập
export const getAllUserOrders: RequestHandler = async (req, res, next) => {
  try {
    // Lấy tất cả đơn hàng từ cơ sở dữ liệu
    const {
      new_docs,
      total_order,
      total_order_money,
      total_order_product,
      total_user,
    } = await getAllUserOrdersService();

    // Gửi phản hồi thành công với thông tin đơn hàng
    return res.status(StatusCodes.OK).json({
      message: 'Lấy toàn bộ đơn hàng thành công',
      res: {
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
      },
    });
  } catch (error) {
    logger.log('error', `Catch error in get all order: ${error}`);
    next(error);
  }
};

export const getOneOrder: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  try {
    const order = await getOneOrderService(id);
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_ORDER_SUCCESS,
      res: order,
    });
  } catch (error) {
    logger.log('error', `Catch error in  get one order: ${error}`);
    next(error);
  }
};

// Cập nhật trạng thái thanh toán của một đơn hàng
export const updatePaymentStatus: RequestHandler = async (req, res, next) => {
  const { _id, orderInfo } = req.body;
  try {
    await updatePaymentStatusService(_id, orderInfo);
    return res.status(StatusCodes.OK).json({
      message: 'Thành công',
    });
  } catch (error) {
    logger.log('error', `Catch error in update payment status: ${error}`);
    next(error);
  }
};

// Giảm số lượng sản phẩm trong order
export const decreaseProductFromOrder: RequestHandler = async (
  req,
  res,
  next,
) => {
  const { order_id, sku_id } = req.body;
  try {
    // Tìm chi tiết đơn hàng tương ứng với order_id và sku_id
    const newUpdateOrder = await decreaseProductFromOrderService(
      order_id,
      sku_id,
    );
    return res.status(StatusCodes.OK).json({
      message: 'Cập nhật thành công',
      res: newUpdateOrder,
    });
  } catch (error) {
    logger.log('error', `Catch error in delete product order: ${error}`);
    next(error);
  }
};

// Hàm xử lý yêu cầu xóa sản phẩm trong đơn hàng
export const removeProductFromOrder: RequestHandler = async (
  req,
  res,
  next,
) => {
  const { order_id, sku_id } = req.body;
  try {
    // Tìm và xóa chi tiết đơn hàng theo order_id và sku_id
    const newUpdateOrder = await removeProductFromOrderService(
      order_id,
      sku_id,
    );
    return res.status(StatusCodes.OK).json({
      message: 'Xóa sản phẩm thành công',
      res: newUpdateOrder,
    });
  } catch (error) {
    logger.log('error', `Catch error in delete product from order: ${error}`);
    next(error);
  }
};

// Hàm xử lý lấy danh sách yêu cầu hoàn trả
export const getReturnedOrder: RequestHandler = async (req, res, next) => {
  const {
    // Trang hiện tại (mặc định là 1)
    _page = 1,
    // Trường để sắp xếp (mặc định là created_at)
    _sort = 'created_at',
    // Thứ tự sắp xếp (mặc định là giảm dần)
    _order = 'desc',
    // Số lượng yêu cầu trả về trên một trang (mặc định là 10)
    _limit = 100,
    // Tìm kiếm theo tên khách hàng
    search,
    // Tình trạng xác nhận
    is_confirm,
    // Ngày để tìm kiếm
    date,
  } = req.query as {
    // Trang hiện tại
    _page?: number | string;
    // Trường sắp xếp
    _sort?: string;
    // Thứ tự sắp xếp
    _order?: 'asc' | 'desc';
    // Số lượng yêu cầu trên một trang
    _limit?: number | string;
    // Từ khóa tìm kiếm
    search?: string;
    // Tình trạng xác nhận
    is_confirm?: boolean;
    // Ngày tìm kiếm
    date?: string;
  };
  try {
    const { orders } = await getReturnedOrderService(
      _page,
      _sort,
      _order,
      _limit,
      search,
      is_confirm,
      date,
    );

    return res.status(StatusCodes.OK).json({
      message: 'Thành công',
      res: {
        items: orders.docs,
        // paginate: orders,
      },
    });
  } catch (error) {
    logger.log('error', `Catch error in get returned order: ${error}`);
    next(error);
  }
};
export const getRefundedOrder: RequestHandler = async (req, res, next) => {
  const {
    // Trang hiện tại (mặc định là 1)
    _page = 1,
    // Trường để sắp xếp (mặc định là created_at)
    _sort = 'created_at',
    // Thứ tự sắp xếp (mặc định là giảm dần)
    _order = 'desc',
    // Số lượng yêu cầu trả về trên một trang (mặc định là 10)
    _limit = 100,
    // Tìm kiếm theo tên khách hàng
    search,
    // Tình trạng xác nhận
    is_confirm,
    // Ngày để tìm kiếm
    date,
  } = req.query as {
    // Trang hiện tại
    _page?: number | string;
    // Trường sắp xếp
    _sort?: string;
    // Thứ tự sắp xếp
    _order?: 'asc' | 'desc';
    // Số lượng yêu cầu trên một trang
    _limit?: number | string;
    // Từ khóa tìm kiếm
    search?: string;
    // Tình trạng xác nhận
    is_confirm?: boolean;
    // Ngày tìm kiếm
    date?: string;
  };
  try {
    const { orders } = await getRefundedOrderService(
      _page,
      _sort,
      _order,
      _limit,
      search,
      is_confirm,
      date,
    );
    return res.status(StatusCodes.OK).json({
      message: 'Thành công',
      res: {
        items: orders.docs,
        // paginate: orders,
      },
    });
  } catch (error) {
    logger.log('error', `Catch error in get returned order: ${error}`);
    next(error);
  }
};
export const updateStatusDelivered: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  try {
    const updateOrder = await updateStatusDeliveredService(id);
    return res.status(StatusCodes.OK).json({
      message: 'Cập nhật trạng thái thành công',
      res: updateOrder,
    });
  } catch (error) {
    logger.log('error', `Catch error in update status delivered: ${error}`);
    next(error);
  }
};

export const cancelOrder: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  try {
    const updateOrder = await cancelOrderService(id);

    if (updateOrder.status === 'Cancelled') {
      const io: Server = req.app.get('io');
      const notification = new Notification({
        userId: updateOrder.user_id, // ID của người nhận thông báo (có thể là admin hoặc người dùng)
        orderId: id,
        status: updateOrder.status,
      });
      await notification.save();
      io.emit('orderUpdated', {
        orderId: id,
        orderData: updateOrder,
        message: notification,
      });
    }
    res.status(StatusCodes.OK).json({
      message: 'Huỷ thành công',
      res: updateOrder,
    });
  } catch (error) {
    logger.log('error', `Catch error in cancel order: ${error}`);
    next(error);
  }
};

export const confirmReturnedOrder: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  try {
    const confirmReturned = await confirmReturnedOrderService(id);

    if (confirmReturned.orderUpdate.status === 'Returned') {
      const io: Server = req.app.get('io');
      const notification = new Notification({
        userId: confirmReturned.orderUpdate.user_id, // ID của người nhận thông báo (có thể là admin hoặc người dùng)
        orderId: id,
        status: confirmReturned.orderUpdate.status,
      });
      await notification.save();
      io.emit('orderUpdated', {
        orderId: id,
        orderData: confirmReturned.orderUpdate,
        message: notification,
      });
    }

    return res.status(StatusCodes.OK).json({
      message: 'Đơn hàng hoàn trả thành công',
    });
  } catch (error) {
    logger.log('error', `Catch error in get returned order: ${error}`);
    next(error);
  }
};
export const cancelReturnedOrder: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  const { reasonCancel } = req.body; // Nhận lý do từ chối từ request body

  if (!reasonCancel || reasonCancel.trim() === '') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Lý do từ chối là bắt buộc.',
    });
  }

  try {
    // Gọi service và truyền lý do từ chối vào
    await cancelReturnedOrderService(id, reasonCancel);

    return res.status(StatusCodes.OK).json({
      message: 'Từ chối hoàn trả đơn hàng thành công',
    });
  } catch (error) {
    logger.log('error', `Catch error in cancel returned order: ${error}`);
    next(error);
  }
};
export const confirmRefundedOrder: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  try {
    await confirmRefundedOrderService(id);
    return res.status(StatusCodes.OK).json({
      message: 'Đơn hàng hoàn tiền thành công',
    });
  } catch (error) {
    logger.log('error', `Catch error in get refunded order: ${error}`);
    next(error);
  }
};

export const updateInfoCustomer: RequestHandler = async (req, res, next) => {
  // Lấy ID đơn hàng từ tham số của request
  const { id } = req.params;
  // Lấy thông tin cần cập nhật từ body của request
  const {
    // Tên khách hàng
    customer_name,
    // Số điện thoại khách hàng
    phone_number,
    // Nội dung đơn hàng
    content,
    // Địa chỉ giao hàng
    shippingAddress,
    // Phí vận chuyển
    transportation_fee,
  }: {
    // Kiểu dữ liệu của tên khách hàng
    customer_name: string;
    // Kiểu dữ liệu của số điện thoại
    phone_number: string;
    // Kiểu dữ liệu của nội dung
    content: string;
    // Kiểu dữ liệu của địa chỉ giao hàng
    shippingAddress: string;
    // Kiểu dữ liệu của phí vận chuyển
    transportation_fee: number;
    // Lấy thông tin từ body của request
  } = req.body;
  try {
    const updatedOrder = await updateInfoCustomerService(
      id,
      customer_name,
      phone_number,
      content,
      shippingAddress,
      transportation_fee,
    );
    return res.status(StatusCodes.OK).json({
      message: 'Đơn hàng đã được cập nhật',
      res: updatedOrder,
    });
  } catch (error) {
    logger.log('error', `Catch error in get returned order: ${error}`);
    next(error);
  }
};

export const getAllShipping: RequestHandler = async (req, res, next) => {
  // Lấy thông tin phân trang và sắp xếp từ query của request
  const {
      // Trang hiện tại, mặc định là 1
      _page = 1,
      // Trường để sắp xếp, mặc định là createdAt
      _sort = 'createdAt',
      // Thứ tự sắp xếp, mặc định là tăng dần
      _order = 'asc',
      // Số lượng bản ghi mỗi trang, mặc định là 10
      _limit = 10,
    }: {
      // Kiểu dữ liệu của trang hiện tại
      _page?: number;
      // Kiểu dữ liệu của trường sắp xếp
      _sort?: string;
      // Kiểu dữ liệu của thứ tự sắp xếp
      _order?: string;
      // Kiểu dữ liệu của số lượng bản ghi mỗi trang
      _limit?: number;
      // Lấy từ query của request
    } = req.query,
    // Lấy tên khách hàng từ query
    customer_name = req.query.q as string | undefined;

  try {
    const { newDocs, orders } = await getAllShippingService(
      _page,
      _sort,
      _order,
      _limit,
      customer_name,
    );

    return res.status(StatusCodes.OK).json({
      message: 'Lấy toàn bộ đơn hàng thành công',
      res: {
        // Danh sách đơn hàng đã tìm thấy
        items: newDocs,
        // Thông tin phân trang
        paginate: orders,
      },
    });
  } catch (error) {
    logger.log('error', `Catch error in get all shipping: ${error}`);
    next(error);
  }
};

export const getTokenPrintBills: RequestHandler = async (req, res, next) => {
  // Lấy order_id từ body của request
  const { order_id } = req.body;
  try {
    // Tìm đơn hàng theo order_id và lấy thông tin shipping_info
    const token_bill = await getTokenPrintBillsService(order_id);
    return res.status(token_bill.code).json({
      message: token_bill.message,
      res: token_bill.data?.token,
    });
  } catch (error) {
    logger.log('error', `Catch error in get token print bills: ${error}`);
    next(error);
  }
};
