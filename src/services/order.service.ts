import { statusOrder } from '@/constants/initialValue';
import Cart from '@/models/Cart';
import { Order, Order_Detail, Shipping } from '@/models/Order';
import { Returned } from '@/models/Return';
import { Sku } from '@/models/Sku';
import moment from '@/moment/ts3.1-typings/moment';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';
import {
  calculateFee,
  getAddressLocation,
  getTokenPrintBill,
} from '@/utils/shipment';
import { StatusCodes } from 'http-status-codes';
import { createMomoService, createVnPayService } from './payment.service';
import { createDeliveryOrderService } from './shipment.service';

// Utils functions
export const buildPaymentMethod = (method: string) => {
  try {
    switch (method) {
      case 'cash':
        // Trả về cấu trúc cho phương thức thanh toán bằng tiền mặt khi nhận hàng
        return {
          // Mô tả phương thức thanh toán
          method: 'Thanh toán khi nhận hàng',
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
          method: 'Thanh toán qua ví MOMO',
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
          method: 'Thanh toán qua VNPAY',
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
          method: 'Thanh toán qua ZALOPAY',
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
  // TODO: Update create payment controller to services
  // Tùy theo phương thức thanh toán (`momo`, `zalopay`, `vnpay`), gọi hàm tạo liên kết thanh toán và lưu liên kết vào `payUrl`
  let payUrl: string | undefined;
  try {
    switch (paymentMethod) {
      case 'momo': {
        const momoResponse: any = await createMomoService(inputData);
        payUrl = momoResponse?.payUrl ?? '';
        break;
      }

      case 'zalopay': {
        const zalopayResponse: any = await createVnPayService(inputData);
        payUrl = zalopayResponse?.payUrl ?? '';
        break;
      }

      case 'vnpay': {
        const vnpayResponse: any = await createVnPayService(inputData);
        payUrl = vnpayResponse?.payUrl ?? '';
        break;
      }

      default:
        logger.log('error', 'Payment method not valid in create order');
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'Phương thức thanh toán không hợp lệ',
        ); // Nếu phương thức thanh toán không hợp lệ, trả về lỗi
    }

    // Kiểm tra nếu `payUrl` không tồn tại, trả về lỗi
    if (!payUrl) {
      logger.log('error', 'Pay URL not found in create order');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Không thể lấy liên kết thanh toán từ phản hồi.',
      );
    }
  } catch (error: any) {
    if (error instanceof AppError) {
      logger.log('error', `Catch error in check payUrl ${error.message}`);
      throw new AppError(StatusCodes.BAD_REQUEST, 'Pay URL wrong');
    }
  }
};

// Services
// TODO: Check
export const createNewOrderService = async (
  address: any,
  shipping_address: any,
  payment_method: any,
  total_amount: any,
  transportation_fee: any = 3000,
  // GuestId:any,
  cart_id: any,
  input: any,
) => {
  //* Find cart exists
  // Tìm giỏ hàng dựa trên `cart_id`, nếu không tồn tại trả về lỗi
  const cart = await Cart.findOne({ _id: cart_id });
  if (!cart) {
    logger.log('error', 'Cart not found in create order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found cart');
  }

  //* Check payment method valid
  // Kiểm tra phương thức thanh toán có hợp lệ và gán vào `paymentMethod`
  const paymentMethod = buildPaymentMethod(payment_method), // Hàm để build phương thức thanh toán
    //* Call payment method and save method
    // TODO: Update create payment controller to services
    // Tùy theo phương thức thanh toán (`momo`, `zalopay`, `vnpay`), gọi hàm tạo liên kết thanh toán và lưu liên kết vào `payUrl`
    payUrl = await checkPaymentMethod(paymentMethod, input),
    //* Create order with infomation and total from cart and shipping fee
    // Tạo đơn hàng với thông tin và tổng tiền từ giỏ hàng và phí vận chuyển
    order = await Order.create({
      input,
      // Tổng tiền bao gồm phí vận chuyển
      total_amount: Number(total_amount) + transportation_fee,
      payment_method: paymentMethod,
      // Đính kèm liên kết thanh toán
      payment_url: payUrl,
    });
  if (!order) {
    logger.log('error', 'Order create error in create order');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Create order error');
  }
  //* Create detail product in order
  // Hàm tạo chi tiết sản phẩm trong đơn hàng
  const addProductItem = async (product: any) => {
      const new_item = await Order_Detail.create({
        order_id: order._id,
        sku_id: product.sku_id,
        price: product.price,
        quantity: product.quantity,
        price_before_discount: product.price_before_discount,
        price_discount_percent: product.price_discount_percent,
        total_money: product.quantity * product.price,
      });
      return new_item;
    },
    //* Take SKU info from database
    // Hàm lấy thông tin SKU dựa vào `sku_id` từ cơ sở dữ liệu
    get_sku = async (sku_id: string) => {
      const skuInfo = await Sku.findById(sku_id);
      if (!skuInfo) {
        logger.log('error', 'SKU not found in create order');
        throw new AppError(StatusCodes.NOT_FOUND, 'SKU not exist');
      }
      return skuInfo;
    },
    //* Create detail product for order from cart
    // Tạo các chi tiết sản phẩm cho đơn hàng từ các sản phẩm trong giỏ hàng
    order_details = await Promise.all(
      cart!.products.map((item) => addProductItem(item)),
    ),
    //* Take detail SKU info for each product in cart
    // Lấy thông tin chi tiết SKU cho từng sản phẩm trong đơn hàng
    new_order_details = await Promise.all(
      order_details.map(async (item) => {
        const data_sku = await get_sku(item.sku_id.toString());
        return {
          _id: item._id,
          sku_id: data_sku?._id,
          name: data_sku?.name,
          price: data_sku?.price,
          price_before_discount: data_sku?.price_before_discount,
          price_discount_percent: data_sku?.price_discount_percent,
          image: data_sku?.image,
          quantity: item.quantity,
          total_money: item.total_money,
        };
      }),
    );
  //* If order have shipping methods, update
  if (order.shipping_method === 'Shipping') {
    await createShippingInfo(
      order,
      address,
      shipping_address,
      transportation_fee,
    );
  }

  //* Clear product in cart when create order success
  // Cập nhật giỏ hàng sau khi đã tạo đơn hàng thành công (xóa sản phẩm trong giỏ)
  await Cart.findOneAndUpdate(
    { cart_id },
    { $set: { products: [], total_money: 0 } },
  );

  return { new_order_details, order };
};
// TODO: Check
export const updateStatusOrderService = async (id: string, status: string) => {
  // Danh sách các trạng thái hợp lệ

  // Kiểm tra xem trạng thái mới có nằm trong danh sách trạng thái hợp lệ hay không
  if (!statusOrder.includes(status)) {
    // Nếu không, ném lỗi 400
    logger.log('error', 'Status not valid in update status order');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Trạng thái không hợp lệ');
  }

  // Tìm kiếm đơn hàng trong cơ sở dữ liệu bằng ID
  const ordered = await Order.findById(id);
  if (!ordered) {
    // Nếu không, ném lỗi 404
    logger.log('error', 'Not find order in update status order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
  }

  // Tìm kiếm chi tiết đơn hàng dựa trên ID của đơn hàng
  const orderDetails = await Order_Detail.find({ order_id: id });
  if (!orderDetails) {
    logger.log('error', 'Not find order details in update status order');
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Không tìm thấy chi tiết đơn hàng',
    );
  }
  // Kiểm tra trạng thái hiện tại của đơn hàng
  const check_status = ordered.status_detail?.find(
    // Tìm trạng thái mới trong chi tiết trạng thái của đơn hàng
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

  // TODO: Update
  // Kiểm tra các điều kiện không cho phép cập nhật trạng thái
  const statusCondition: { [key: string]: () => void } = {
    cancelled: () => {
      if (ordered?.status === 'cancelled') {
        logger.log('error', 'Order was cancelled update status order');
        throw new AppError(StatusCodes.BAD_REQUEST, 'Đơn hàng đã được hủy');
      }
    },
    delivered: () => {
      if (ordered.status === 'delivered') {
        logger.log('error', 'Order was complete in update status order');
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'Đơn hàng đã được hoàn thành',
        );
      }
      if (ordered.status !== 'confirmed') {
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
      if (ordered?.status === 'delivered') {
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

  // Nếu trạng thái mới là "confirmed" và phương thức vận chuyển là "shipped"
  if (status === 'confirmed' && ordered.shipping_method === 'Shipping') {
    // Tìm thông tin giao hàng dựa trên thông tin shipping_info của đơn hàng
    const shipping = await Shipping.findOne({ _id: ordered.shipping_info });
    if (!shipping) {
      logger.log(
        'error',
        'Can not find delivery info order in update status order',
      );
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'Không tìm thấy thông tin giao hàng cho đơn hàng này',
      );
    }

    //* Find SKU info
    // Hàm lấy thông tin SKU dựa trên ID
    const getSKU = async (sku_id: string) => {
        const new_item = await Sku.findById(sku_id);
        if (!new_item) {
          logger.log('error', 'SKU ID not found in update status order');
          throw new AppError(
            StatusCodes.NOT_FOUND,
            `SKU with ID ${sku_id} not found`,
          );
        }
        return new_item;
      },
      //* Take info details
      // Lấy thông tin chi tiết đơn hàng mới bằng cách tìm thông tin SKU cho từng mục
      new_order_details = await Promise.all(
        orderDetails.map(async (item) => {
          const data_sku = await getSKU(item.sku_id.toString());
          return {
            _id: item._id,
            sku_id: data_sku._id,
            name: data_sku.name,
            price: data_sku.price,
            price_before_discount: data_sku.price_before_discount,
            price_discount_percent: data_sku.price_discount_percent,
            image: data_sku.image,
            quantity: item.quantity,
            total_money: item.total_money,
          };
        }),
      ),
      // Tách địa chỉ giao hàng thành các phần
      address_detail = shipping.shipping_address.split(','),
      // Const addressString = address_detail.join(',');
      // Const address = address_detail.shift();
      // Lấy phần địa chỉ chính
      code_ward_district = await getAddressLocation(
        // Gọi hàm lấy mã phường/xã và quận/huyện từ địa chỉ
        address_detail.join(','),
      );
    // Kiểm tra xem có lấy được thông tin mã phường/xã và quận/huyện không
    if (!code_ward_district) {
      logger.log(
        'error',
        'Can not find district from address in update status order',
      );
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Không thể lấy mã phường/xã và quận/huyện từ địa chỉ', // Nếu không lấy được
      );
    }

    // Dữ liệu để gửi đi cho API tạo đơn hàng mới
    const data_shipping = {
        to_name: ordered.customer_name,
        to_phone: ordered.phone_number,
        to_address: shipping.shipping_address,
        to_ward_code: code_ward_district.ward_code,
        // Lấy DistrictID từ district
        to_district_id: code_ward_district.district.DistrictID,
        content: ordered.content,
        // Ví dụ: trọng lượng của một chiếc tủ
        weight: 10,
        // Chiều dài 100 cm
        length: 100,
        // Chiều rộng 60 cm
        width: 90,
        // Chiều cao 75 cm
        height: 75,
        service_type_id: 2,
        service_id: 53319,
        payment_type_id: 1,
        required_note: 'CHOXEMHANGKHONGTHU',
        Items: new_order_details,
        name: 'Đồ nội thất',
        quantity: new_order_details.length,
      },
      //* Create new shipment order
      // Gọi API tạo đơn hàng mới
      orderCode = await createDeliveryOrderService(data_shipping);

    // Nếu tạo đơn hàng thành công
    if (orderCode.data.code === StatusCodes.OK) {
      // Cập nhật thông tin giao hàng với mã đơn hàng mới và thời gian giao hàng ước tính
      await Shipping.findByIdAndUpdate(
        { _id: ordered.shipping_info },
        {
          $set: {
            order_code: orderCode.data.data.order_code,
            estimated_delivery_date: orderCode.data.data.expected_delivery_time,
          },
        },
      );
    }
  }

  // Cập nhật trạng thái đơn hàng trong cơ sở dữ liệu
  const updateOrder = await Order.findByIdAndUpdate(
    id,
    {
      // Cập nhật trạng thái
      $set: { status },
      $push: {
        status_detail: {
          // Thêm trạng thái mới vào lịch sử trạng thái
          status,
        },
      },
    },
    // Trả về bản ghi đã được cập nhật
    { new: true },
  ).populate([
    // Populate để lấy thông tin chi tiết từ trường shipping_info
    {
      path: 'shipping_info',
    },
  ]);
  if (!updateOrder) {
    logger.log('error', 'Order update error in update status');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Update status order error');
  }

  return updateOrder;
};
// TODO: Check
export const returnedOrder = async (
  order_id: any,
  reason: any,
  customer_name: any,
  phone_number: any,
  images: any,
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
  if (order.status === 'returned' || order.status !== 'delivered') {
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
// TODO: Check
export const serviceCalFeeService = async (location: string) => {
  const code_location = await getAddressLocation(location); // Lấy thông tin địa điểm
  // Kiểm tra xem code_location có tồn tại không
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
// TODO: Check
export const increaseProductFromOrderService = async (
  order_id: any,
  sku_id: any,
) => {
  // Tìm chi tiết đơn hàng tương ứng với order_id và sku_id
  const orderDetail = await Order_Detail.findOne({
    $and: [{ order_id }, { sku_id }],
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

  // Kiểm tra nếu số lượng kho nhỏ hơn số lượng trong chi tiết đơn hàng
  if (SKU.stock < orderDetail.quantity) {
    logger.log('error', 'Product exceed quantity in add one product order');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Sản phẩm quá số lượng');
  } else {
    // Giảm số lượng kho xuống 1
    const new_stock = SKU.stock - 1;
    // Cập nhật số lượng kho trong cơ sở dữ liệu
    await Sku.findByIdAndUpdate(sku_id, {
      $set: { stock: new_stock },
    });
  }

  // Tăng số lượng sản phẩm trong chi tiết đơn hàng
  orderDetail.quantity++;
  // Cập nhật tổng tiền dựa trên số lượng và giá
  orderDetail.total_money = orderDetail.quantity * orderDetail.price;
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
        total + (amount.total_money ?? 0),
      0,
    ),
    // Cập nhật tổng tiền cho đơn hàng
    newOrder = await Order.findByIdAndUpdate(
      order_id,
      {
        $set: { total_amount }, // Cập nhật tổng tiền
      },
      { new: true }, // Trả về tài liệu đã cập nhật
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
// TODO: Check
export const decreaseProductFromOrder = async (order_id: any, sku_id: any) => {
  // Tìm chi tiết đơn hàng tương ứng với order_id và sku_id
  const orderDetail = await Order_Detail.findOne({
    $and: [{ order_id }, { sku_id }],
  });
  if (!orderDetail) {
    logger.log('error', 'Order detail not found in delete product order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy sản phẩm');
  }

  // Kiểm tra số lượng sản phẩm
  if (orderDetail.quantity <= 1) {
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
  orderDetail.quantity--;
  // Cập nhật tổng tiền dựa trên số lượng và giá
  orderDetail.total_money = orderDetail.quantity * orderDetail.price;
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
  // TODO: create this into reuseable function
  // Tính tổng tiền của đơn hàng
  const total_amount = orderDetails.reduce(
      (total, amount) => total + (amount.total_money ?? 0),
      0,
    ),
    // Cập nhật tổng tiền cho đơn hàng
    newUpdateOrder = await Order.findByIdAndUpdate(
      order_id,
      {
        $set: { total_amount }, // Cập nhật tổng tiền
      },
      { new: true }, // Trả về tài liệu đã cập nhật
    );
  if (!newUpdateOrder) {
    logger.log('error', 'Order update failed in delete product order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Order update failed');
  }
  return newUpdateOrder;
};
// TODO: CHeck
export const getOrderByPhoneNumber = async (conditions: any, options: any) => {
  // 5. Tìm kiếm và phân trang dữ liệu
  const orders = await Order.paginate(conditions, options);

  // 6. Xử lý khi không tìm thấy đơn hàng
  if (!orders.length) {
    logger.log('error', 'Order not found in get one by phone number order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
  }

  // 7. Lấy chi tiết từng đơn hàng trong danh sách kết quả
  const orderDetailsPromises = orders.docs.map(async (result) => {
      const orderDetails = await Order_Detail.find({ order_id: result._id }); // Lấy chi tiết đơn hàng
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
          const sku = await Sku.findOne({ _id: item.sku_id }).select(
              // Lấy tên, URL chia sẻ và hình ảnh
              'name shared_url image',
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
    // 8. Hoàn thành xử lý chi tiết từng đơn hàng
    ordersWithDetails = await Promise.all(orderDetailsPromises);
  if (!ordersWithDetails) {
    logger.log('error', 'Order details error in get one by phone number order');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Error when search detail');
  }
  // 9. Trả về phản hồi JSON với danh sách đơn hàng và thông tin phân trang
  return { ordersWithDetails, orders };
};
// TODO: Check
export const getOrderByUserId = async (conditions: any, options: any) => {
  // Tìm kiếm đơn hàng
  const order = await Order.paginate(conditions, options);
  if (!order.length) {
    logger.log('error', 'Order not found in get one by user id order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
  }

  // Tìm kiếm chi tiết đơn hàng
  const orderDetailsPromises = order.docs.map(async (item) => {
      const orderDetails = await Order_Detail.find({ order_id: item._id });
      if (!orderDetails) {
        logger.log(
          'error',
          'Order detail not found in get one by user id order',
        );
        throw new AppError(
          StatusCodes.NOT_FOUND,
          'Không tìm thấy đơn hàng chi tiết',
        );
      }
      const newOrderDetails = await Promise.all(
        orderDetails.map(async (detail) => {
          const sku = await Sku.findOne({ _id: detail.sku_id }).select(
            'name shared_url image',
          );
          return {
            ...detail.toObject(),
            ...(sku ? sku.toObject() : {}),
          };
        }),
      );

      return {
        ...item.toObject(),
        order_details: newOrderDetails,
      };
    }),
    ordersWithDetails = await Promise.all(orderDetailsPromises);
  if (!ordersWithDetails) {
    logger.log('error', 'Order details error in get one by user id order');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Error when search detail');
  }

  return { ordersWithDetails, order };
};
// TODO: Check
export const getAllOrders = async (conditions: any, options: any) => {
  // Thực hiện truy vấn và phân trang
  const orders = await Order.paginate(conditions, options);
  if (!orders.length) {
    logger.log('error', 'Can not find order in get all order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Can not find order');
  }

  // Lấy chi tiết cho từng đơn hàng
  const new_docs = await Promise.all(
    orders.docs.map(async (item: any) => {
      const order_details = await Order_Detail.find({ order_id: item._id }), // Lấy chi tiết sản phẩm của đơn hàng
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
// TODO: Check
export const getAllUserOrders = async () => {
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
        const order_details = await Order_Detail.find({ order_id: item._id }),
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
// TODO: Check
export const getOneOrder = async (id: string) => {
  const order = await Order.findById(id).exec();
  if (!order) {
    logger.log('error', 'Order not found in get one status');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Order not exist');
  }
  return order;
};
// TODO: Check
export const updatePaymentStatus = async (_id: string, orderInfo: string) => {
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
// TODO: Check
export const removeProductFromOrder = async (order_id: any, sku_id: any) => {
  // Tìm và xóa chi tiết đơn hàng theo order_id và sku_id
  const orderDetail = await Order_Detail.findOneAndDelete({
    $and: [{ order_id }, { sku_id }],
  });
  // Kiểm tra xem orderDetail có tồn tại không
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
        total + (amount.total_money ?? 0),
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
// TODO: Check
export const getReturnedOrder = async (
  // Trang hiện tại (mặc định là 1)
  _page: any = 1,
  // Trường để sắp xếp (mặc định là created_at)
  _sort: any = 'created_at',
  // Thứ tự sắp xếp (mặc định là giảm dần)
  _order: any = 'desc',
  // Số lượng yêu cầu trả về trên một trang (mặc định là 10)
  _limit: any = 10,
  // Tìm kiếm theo tên khách hàng
  search: any,
  // Tình trạng xác nhận
  is_confirm: any,
  // Ngày để tìm kiếm
  date: any,
) => {
  // Khởi tạo đối tượng điều kiện tìm kiếm
  const conditions: Record<string, any> = {};

  // Thêm điều kiện tìm kiếm theo tên khách hàng
  if (search) {
    conditions.customer_name = { $regex: new RegExp(search, 'i') }; // Tìm kiếm không phân biệt hoa thường
  }

  // Thêm điều kiện xác nhận
  if (is_confirm) {
    conditions.is_confirm = is_confirm; // Thêm điều kiện xác nhận nếu có
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
        [_sort]: _order === 'desc' ? -1 : 1, // Sắp xếp theo trường và thứ tự
      },
      select: ['-deleted', '-deleted_at'], // Chọn các trường để trả về
    },
    // Lấy danh sách yêu cầu hoàn trả từ cơ sở dữ liệu
    orders = await Returned.paginate(conditions, options);
  return { orders };
};
// TODO: Check
export const updateStatusDelivered = async (id: string) => {
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
// TODO: Check
export const cancelOrder = async (id: string) => {
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
    { new: true },
  ).populate([
    {
      path: 'shipping_info',
    },
  ]);
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

      return await Sku.findByIdAndUpdate(
        product.sku_id,
        {
          $set: { stock: newStock },
        },
        { new: true },
      );
    },
    orderDetails = await Order_Detail.find({ order_id: id });
  if (!orderDetails) {
    logger.log('error', 'Order detail not found in cancel order');
    throw new AppError(StatusCodes.NOT_FOUND, 'Order detail not found');
  }
  await Promise.all(
    orderDetails.map((item) =>
      checkSkuStock({
        sku_id: item.sku_id.toString(),
        quantity: item.quantity,
      }),
    ),
  );
  return updateOrder;
};
// TODO: Check
export const confirmReturnedOrder = async (id: string) => {
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
      $set: { status: 'returned' },
      $push: {
        status_detail: {
          status: 'returned',
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
        logger.log('error', 'SKU not found in confirm return order');
        throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy SKU');
      }
      // Tăng số lượng tồn kho cho sản phẩm
      const new_stock = SKU.stock + product.quantity;
      await Sku.findByIdAndUpdate(product.sku_id, {
        $set: {
          stock: new_stock,
        },
      });
    },
    orderItems = await Order_Detail.find({
      order_id: returned.order_id,
    }).select('sku_id quantity');
  if (!orderItems) {
    logger.log('error', 'Order detail not found in confirm return order');
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Không tìm thấy đơn hàng chi tiết',
    );
  }
  await Promise.all(
    orderItems.map((item) =>
      checkSKUStock({
        sku_id: item.sku_id.toString(),
        quantity: item.quantity,
      }),
    ),
  );
  return;
};
// TODO: Check
export const updateInfoCustomer = async (
  id: string,
  // Tên khách hàng
  customer_name: any,
  // Số điện thoại khách hàng
  phone_number: any,
  // Nội dung đơn hàng
  content: any,
  // Địa chỉ giao hàng
  shippingAddress: any,
  // Phí vận chuyển
  transportation_fee: any,
) => {
  // Tìm kiếm đơn hàng bằng ID và lấy thông tin vận chuyển
  const order = await Order.findById(id).populate({
    path: 'shipping_info', // Lấy thông tin từ bảng shipping_info
  });
  if (!order) {
    logger.log('error', 'Order not found in update info customer');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
  }

  // Kiểm tra trạng thái đơn hàng để xác định xem có thể sửa đổi không
  if (
    order.status === 'cancelled' || // Nếu đơn hàng đã bị hủy
    order.status === 'delivering' || // Nếu đơn hàng đang được giao
    order.status === 'delivered' // Nếu đơn hàng đã được giao
  ) {
    logger.log('error', 'Order can not fix in update info customer');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Không thể sửa đơn hàng');
  }

  // Cập nhật thông tin vận chuyển nếu đơn hàng đã được giao ("shipped")
  if (order.shipping_method === 'Shipping' && order.shipping_info?._id) {
    await Shipping.findByIdAndUpdate(
      order.shipping_info._id, // ID thông tin vận chuyển
      {
        $set: {
          shipping_address: shippingAddress, // Cập nhật địa chỉ giao hàng
          transportation_fee, // Cập nhật phí vận chuyển
        },
      },
      { new: true }, // Trả về tài liệu đã cập nhật
    );
  }

  // Cập nhật thông tin khách hàng trong đơn hàng
  const updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      $set: {
        customer_name, // Cập nhật tên khách hàng
        phone_number, // Cập nhật số điện thoại
        content, // Cập nhật nội dung
      },
    },
    { new: true }, // Trả về tài liệu đã cập nhật
  );
  if (updatedOrder) {
    logger.log('error', 'Order update failed in update info customer');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Order update failed');
  }
  return updatedOrder;
};
// TODO: Check
// export const getAllShipping = async (
//   // Trang hiện tại, mặc định là 1
//   _page: any = 1,
//   // Trường để sắp xếp, mặc định là createdAt
//   _sort: any = 'createdAt',
//   // Thứ tự sắp xếp, mặc định là tăng dần
//   _order: any = 'asc',
//   // Số lượng bản ghi mỗi trang, mặc định là 10
//   _limit: any = 10,
//   customer_name: any,
// ) => {
//   const options = {
//     // Trang hiện tại
//     page: _page,
//     // Số lượng bản ghi mỗi trang
//     limit: _limit,
//     sort: {
//       // Sắp xếp theo thứ tự giảm dần hoặc tăng dần
//       [_sort]: _order === 'desc' ? -1 : 1,
//     },
//   };
//   // Nếu có tên khách hàng được chỉ định trong query
//   if (customer_name) {
//     // Thực hiện phân trang và tìm kiếm theo tên khách hàng
//     const orders = await Order.paginate(
//       {
//         // Chỉ lấy đơn hàng đã được giao
//         shipping_method: 'shipped',
//         // Tìm kiếm tên khách hàng không phân biệt hoa thường
//         customer_name: { $regex: customer_name, $options: 'i' },
//       },
//       // Áp dụng các tùy chọn phân trang
//       options,
//     );
//     if (!orders.length) {
//       logger.log('error', 'Can not find order in get all shipping');
//       throw new AppError(StatusCodes.NOT_FOUND, 'Can not find order');
//     }
//     // Lấy chi tiết đơn hàng cho từng đơn hàng đã tìm thấy
//     const newDocs = await Promise.all(
//       orders.docs.map(async (item) => {
//         const order_details = await Order_Detail.find({ order_id: item._id }), // Tìm chi tiết đơn hàng
//           // Chuyển đổi tài liệu thành đối tượng JS
//           orders = item.toObject();
//         return {
//           // Giữ nguyên thông tin đơn hàng
//           ...orders,
//           // Thêm danh sách sản phẩm vào đơn hàng
//           products: order_details,
//         };
//       }),
//     );

//     // Trả về phản hồi với dữ liệu đã lấy và thông tin phân trang
//     return res.status(StatusCodes.OK).json({
//       // Thông điệp phản hồi
//       message: 'Lấy toàn bộ đơn hàng thành công',
//       data: {
//         // Danh sách đơn hàng đã tìm thấy
//         items: newDocs,
//         // Thông tin phân trang
//         paginate: orders,
//       },
//     });
//   }
//   // Nếu không có tên khách hàng trong query
//   // Thực hiện phân trang để lấy tất cả đơn hàng đã giao
//   const orders = await Order.paginate(
//     {
//       shipping_method: 'shipped', // Chỉ lấy đơn hàng đã được giao
//     },
//     // Áp dụng các tùy chọn phân trang
//     options,
//   );
//   if (!orders.length) {
//     logger.log('error', 'Can not find order in get all shipping');
//     throw new AppError(StatusCodes.NOT_FOUND, 'Can not find order');
//   }
//   // Lấy chi tiết đơn hàng cho từng đơn hàng đã tìm thấy
//   const newDocs = await Promise.all(
//     orders.docs.map(async (item) => {
//       // Tìm chi tiết đơn hàng
//       const order_details = await Order_Detail.find({ order_id: item._id }),
//         // Chuyển đổi tài liệu thành đối tượng JS
//         orders = item.toObject();
//       return {
//         // Giữ nguyên thông tin đơn hàng
//         ...orders,
//         // Thêm danh sách sản phẩm vào đơn hàng
//         products: order_details,
//       };
//     }),
//   );
//   return { newDocs, orders };
// };
// TODO: CHeck
export const getTokenPrintBills = async (order_id: string) => {
  // Tìm đơn hàng theo order_id và lấy thông tin shipping_info
  const order = await Order.findById(order_id).populate('shipping_info');
  if (!order) {
    // Nếu không tìm thấy đơn hàng, ném lỗi NotFound
    logger.log('error', 'Can not find order in get token print bills');
    throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
  }

  // Kiểm tra nếu phương thức giao hàng là 'at_store'
  if (order.shipping_method === 'In-store') {
    // Nếu đơn hàng này là mua tại cửa hàng, ném lỗi BadRequest
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
      // Nếu không tìm thấy thông tin giao hàng, ném lỗi NotFound
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
          // Tìm thông tin SKU cho từng item trong đơn hàng
          const data_sku = await Sku.findById(item.sku_id);
          if (!data_sku) {
            // Nếu không tìm thấy SKU, ném lỗi NotFound
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
            quantity: item.quantity,
            total_money: item.total_money,
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
        weight: 1000, // Trọng lượng (gram)
        length: 15, // Chiều dài (cm)
        width: 15, // Chiều rộng (cm)
        height: 15, // Chiều cao (cm)
        service_type_id: 2, // Loại dịch vụ
        service_id: 53319, // ID dịch vụ
        payment_type_id: 1, // Loại hình thanh toán
        required_note: 'CHOXEMHANGKHONGTHU', // Ghi chú yêu cầu
        Items: new_order_details, // Danh sách sản phẩm
        name: 'Đồ điện tử', // Tên sản phẩm chung
        quantity: new_order_details.length, // Số lượng sản phẩm
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
      // Nếu không thể tạo mã vận đơn, ném lỗi BadRequest
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
    // Nếu không tìm thấy token, ném lỗi BadRequest
    logger.log('error', 'Token print bill not found in get token print bills');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Không tìm thấy token hoá đơn');
  }
  return token_bill;
};
