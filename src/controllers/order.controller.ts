import { messagesError, messagesSuccess } from '@/constants/messages';
import Cart from '@/models/Cart';
import { Order, Order_Detail, Shipping } from '@/models/Order';
import { Returned } from '@/models/Return';
import { Sku } from '@/models/Sku';
import {
  calculateFee,
  getAddressLocation,
  getTokenPrintBill,
} from '@/utils/shipment';
import axios from 'axios';
import { RequestHandler } from 'express';
import createError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import mongoose from 'mongoose';
import { createMomo, createVnPay, createZaloPay } from './payment.controller';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';
import { statusOrder } from '@/constants/initialValue';

// Utils functions
export const buildPaymentMethod = (method: string) => {
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
  const detail_address = `${address},${shipping_address}`;

  // Tạo bản ghi trong bảng Shipping với địa chỉ giao hàng và phí vận chuyển
  const shippingInfo = await Shipping.create({
    shipping_address: detail_address,
    transportation_fee,
  });

  // Cập nhật thông tin giao hàng cho đơn hàng bằng cách lưu `shippingInfo._id` vào trường `shipping_info` của order
  order.shipping_info = shippingInfo._id;

  // Lưu thay đổi vào cơ sở dữ liệu
  await order.save();
};

//TODO: Analyze this, check payurl
// Controllers
export const CreateOrder: RequestHandler = async (req, res, next) => {
  try {
    // Trích xuất các thông tin cần thiết từ `req.body` để tạo đơn hàng
    const {
      address,
      shipping_address,
      payment_method,
      total_amount,
      transportation_fee = 3000,
      // guestId,
      cart_id,
      ...body
    } = req.body;

    //* Find cart exists
    // Tìm giỏ hàng dựa trên `cart_id`, nếu không tồn tại trả về lỗi
    const cart = await Cart.findOne({ _id: cart_id });
    if (!cart) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Not found cart');
    }

    //* Check payment method valid
    // Kiểm tra phương thức thanh toán có hợp lệ và gán vào `paymentMethod`
    let paymentMethod;
    try {
      paymentMethod = buildPaymentMethod(payment_method); // Hàm để build phương thức thanh toán
    } catch (error: any) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error.message });
    }

    //* Call payment method and save method
    // TODO: Update create payment controller to services
    // Tùy theo phương thức thanh toán (`momo`, `zalopay`, `vnpay`), gọi hàm tạo liên kết thanh toán và lưu liên kết vào `payUrl`
    let payUrl: string | undefined;
    try {
      switch (payment_method) {
        case 'momo':
          const momoResponse: any = await createMomo(req, res, next);
          payUrl = momoResponse?.payUrl ?? '';
          break;

        case 'zalopay':
          const zalopayResponse: any = await createZaloPay(req, res, next);
          payUrl = zalopayResponse?.payUrl ?? '';
          break;

        case 'vnpay':
          const vnpayResponse: any = await createVnPay(req, res, next);
          payUrl = vnpayResponse?.payUrl ?? '';
          break;

        default:
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Phương thức thanh toán không hợp lệ',
          ); // Nếu phương thức thanh toán không hợp lệ, trả về lỗi
      }

      // Kiểm tra nếu `payUrl` không tồn tại, trả về lỗi
      if (!payUrl) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'Không thể lấy liên kết thanh toán từ phản hồi.',
        );
      }
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.log('error', `Catch error in check payUrl ${error.message}`);
        next(error);
      }
    }

    //* Create order with infomation and total from cart and shipping fee
    // Tạo đơn hàng với thông tin và tổng tiền từ giỏ hàng và phí vận chuyển
    const order = await Order.create({
      ...body,
      total_amount: Number(total_amount) + transportation_fee, // Tổng tiền bao gồm phí vận chuyển
      payment_method: paymentMethod,
      payment_url: payUrl, // Đính kèm liên kết thanh toán
    });

    //* Create detail product in order
    // Hàm tạo chi tiết sản phẩm trong đơn hàng
    const add_product_item = async (product: any) => {
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
    };

    //* Take SKU info from database
    // Hàm lấy thông tin SKU dựa vào `sku_id` từ cơ sở dữ liệu
    const get_sku = async (sku_id: string) => {
      const skuInfo = await Sku.findById(sku_id);
      if (!skuInfo) {
        throw new AppError(StatusCodes.NOT_FOUND, 'SKU not exist');
      }
      return skuInfo;
    };

    //* Create detail product for order from cart
    // Tạo các chi tiết sản phẩm cho đơn hàng từ các sản phẩm trong giỏ hàng
    const order_details = await Promise.all(
      cart!.products.map((item) => {
        return add_product_item(item);
      }),
    );

    //* Take detail SKU info for each product in cart
    // Lấy thông tin chi tiết SKU cho từng sản phẩm trong đơn hàng
    const new_order_details = await Promise.all(
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

    // Trả về phản hồi đơn hàng cùng với liên kết thanh toán
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CREATE_ORDER_SUCCESS,
      res: {
        ...order.toObject(),
        products: new_order_details,
        payment_method: order.payment_method,
        payment_url: order.payment_url, // Đính kèm liên kết thanh toán
      },
    });
  } catch (error) {
    // Xử lý lỗi nếu có xảy ra trong quá trình tạo đơn hàng
    console.error('Lỗi khi tạo đơn hàng:', error);
    logger.log('error', `Catch error in create order: ${error}`);
    next(error);
  }
};
//TODO: Analyze this
// cập nhật trạng thái của một đơn hàng
export const updateStatus: RequestHandler = async (req, res, next) => {
  // Lấy ID của đơn hàng từ tham số đường dẫn (URL)
  const { id } = req.params;

  // Lấy trạng thái mới từ yêu cầu (request body)
  const { status } = req.body;
  try {
    // Danh sách các trạng thái hợp lệ

    // Kiểm tra xem trạng thái mới có nằm trong danh sách trạng thái hợp lệ hay không
    if (!statusOrder.includes(status)) {
      // Nếu không, ném lỗi 400
      throw new AppError(StatusCodes.BAD_REQUEST, 'Trạng thái không hợp lệ');
    }

    // Tìm kiếm đơn hàng trong cơ sở dữ liệu bằng ID
    const ordered = await Order.findById(id);

    // Kiểm tra xem đơn hàng có tồn tại không
    if (!ordered) {
      // Nếu không, ném lỗi 404
      throw new AppError(StatusCodes.NOT_FOUND, 'Không tìm thấy đơn hàng');
    }

    // Tìm kiếm chi tiết đơn hàng dựa trên ID của đơn hàng
    const order_details = await Order_Detail.find({ order_id: id });

    // Kiểm tra trạng thái hiện tại của đơn hàng
    const check_status = ordered.status_detail?.find(
      // Tìm trạng thái mới trong chi tiết trạng thái của đơn hàng
      (item) => item.status === status,
    );
    if (check_status) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Trạng thái đã tồn tại');
    }
    if (ordered?.status === status) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Trạng thái không thay đổi');
    }

    // TODO: Update
    // Kiểm tra các điều kiện không cho phép cập nhật trạng thái
    const statusCondition: { [key: string]: () => void } = {
      cancelled: () => {
        if (ordered?.status === 'cancelled') {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Đơn hàng đã được hủy');
        }
      },
      delivered: () => {
        if (ordered.status === 'delivered') {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Đơn hàng đã được hoàn thành',
          );
        }
        if (ordered.status !== 'confirmed') {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Đợi xác nhận từ khách hàng để hoàn thành đơn',
          );
        }
      },
      returned: () => {
        if (ordered?.status === 'delivered') {
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

      // Kiểm tra xem thông tin giao hàng có tồn tại không
      if (!shipping) {
        throw createError.NotFound(
          'Không tìm thấy thông tin giao hàng cho đơn hàng này',
        );
      }

      // Hàm lấy thông tin SKU dựa trên ID
      const get_sku = async (sku_id: string) => {
        const new_item = await Sku.findById(sku_id);
        if (!new_item) {
          throw createError.NotFound(`SKU with ID ${sku_id} not found`);
        }
        return new_item;
      };
      // Lấy thông tin chi tiết đơn hàng mới bằng cách tìm thông tin SKU cho từng mục
      const new_order_details = await Promise.all(
        order_details.map(async (item) => {
          const data_sku = await get_sku(item.sku_id.toString());
          // Kiểm tra nếu không tìm thấy SKU
          if (!data_sku) {
            throw new AppError(
              StatusCodes.BAD_REQUEST,
              `SKU with ID ${item.sku_id} not found`,
            );
          }
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
      );

      // Tách địa chỉ giao hàng thành các phần
      const address_detail = shipping.shipping_address.split(',');
      const addressString = address_detail.join(',');
      console.log('Địa chỉ:', addressString);
      const address = address_detail.shift();
      // Lấy phần địa chỉ chính
      const code_ward_district = await getAddressLocation(
        address_detail.join(','), // Gọi hàm lấy mã phường/xã và quận/huyện từ địa chỉ
      );
      // Kiểm tra xem có lấy được thông tin mã phường/xã và quận/huyện không
      if (!code_ward_district) {
        throw createError.NotFound(
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
      };

      // Gọi API tạo đơn hàng mới
      const orderCode = await axios.post(
        'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create',
        data_shipping,
        {
          headers: {
            Token: process.env.GHN_SHOP_TOKEN, // Thêm token vào headers
            ShopId: process.env.GHN_SHOP_ID,
            'Content-Type': 'application/json',
          },
        },
      );

      // Nếu tạo đơn hàng thành công
      if (orderCode.data.code === 200) {
        // Cập nhật thông tin giao hàng với mã đơn hàng mới và thời gian giao hàng ước tính
        await Shipping.findByIdAndUpdate(
          { _id: ordered.shipping_info },
          {
            $set: {
              order_code: orderCode.data.data.order_code,
              estimated_delivery_date:
                orderCode.data.data.expected_delivery_time,
            },
          },
        );
      }
    }

    // Cập nhật trạng thái đơn hàng trong cơ sở dữ liệu
    const order = await Order.findByIdAndUpdate(
      id,
      {
        // Cập nhật trạng thái
        $set: { status: status },
        $push: {
          status_detail: {
            // Thêm trạng thái mới vào lịch sử trạng thái
            status: status,
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

    return res.status(StatusCodes.CREATED).json({
      message: 'Order update successfully',
      res: order,
    });
  } catch (error) {
    logger.log('error', `Catch error in get update status ${error}`);
    next(error);
  }
};

//TODO: Later
// Hàm xử lý yêu cầu hoàn trả đơn hàng
export const returnedOrder: RequestHandler = async (req, res, next) => {
  try {
    // Phân tách thông tin từ body của yêu cầu
    const { order_id, reason, customer_name, phone_number, images } =
      req.body as {
        order_id: string; // ID của đơn hàng
        reason: string; // Lý do hoàn trả
        customer_name: string; // Tên khách hàng
        phone_number: string; // Số điện thoại của khách hàng
        images: string[]; // Hình ảnh chứng minh yêu cầu hoàn trả
      };

    // Kiểm tra xem đã có yêu cầu hoàn trả cho đơn hàng này chưa
    const return_order = await Returned.findOne({ order_id });
    if (return_order) {
      throw createError.BadRequest('Đơn hàng đã được yêu cầu hoàn hàng'); // Nếu đã có, trả về lỗi
    }

    // Tìm kiếm đơn hàng theo order_id
    const order = await Order.findById(order_id);
    // Xử lý khi order là null
    if (!order) {
      throw createError.NotFound('Đơn hàng không tìm thấy');
    }
    // Kiểm tra trạng thái đơn hàng, phải là 'delivered' để hoàn trả
    if (order.status === 'returned' || order.status !== 'delivered') {
      throw createError.BadRequest('Trạng thái đơn hàng không thể hoàn'); // Nếu không thể hoàn trả, trả về lỗi
    }

    // Tạo yêu cầu hoàn trả mới
    const returned = await Returned.create({
      order_id,
      reason,
      customer_name,
      phone_number,
      images,
    });

    // Kiểm tra xem yêu cầu hoàn trả đã được tạo thành công chưa
    if (!returned) throw createError.BadRequest('Hoàn hàng không thành công');

    return res.json({
      status: 200,
      message: 'Tạo yêu cầu hoàn hàng thành công',
      data: returned,
    });
  } catch (error) {
    next(error);
  }
};

// TODO: Maybe remove
// Tính tiền vận chuyển
export const serviceFree: RequestHandler = async (req, res, next) => {
  try {
    const location = req.body;
    const code_location = await getAddressLocation(location); // Lấy thông tin địa điểm
    // Kiểm tra xem code_location có tồn tại không
    if (!code_location) {
      throw createError.BadRequest(
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
    };

    // Tính tổng tiền vận chuyển
    const total_money = await calculateFee(data as any);

    // Kiểm tra mã phản hồi
    if (total_money.code !== 200) {
      throw createError.BadRequest('Không thể tính phí vận chuyển');
    }

    return res.json({
      status: 200,
      message: 'thành công',
      data: total_money.data.total,
    });
  } catch (error) {
    next(error);
  }
};

// TODO: Later
// hàm xử lý yêu cầu thêm sản phẩm vào đơn hàng
export const addOneProduct_order: RequestHandler = async (req, res, next) => {
  try {
    const { order_id, sku_id } = req.body; // Lấy order_id và sku_id từ thân yêu cầu

    // Tìm chi tiết đơn hàng tương ứng với order_id và sku_id
    const orderDetail = await Order_Detail.findOne({
      $and: [{ order_id }, { sku_id }],
    });

    // Kiểm tra nếu không tìm thấy chi tiết đơn hàng
    if (!orderDetail) {
      throw createError.NotFound('Không tìm thấy sản phẩm'); // Ném lỗi 404
    }

    // Tìm SKU dựa trên sku_id
    const sku = await Sku.findById(sku_id);
    // Kiểm tra nếu không tìm thấy SKU
    if (!sku) {
      throw createError.NotFound('Không tìm thấy SKU'); // Ném lỗi 404
    }

    // Kiểm tra nếu số lượng kho nhỏ hơn số lượng trong chi tiết đơn hàng
    if (sku.stock < orderDetail.quantity) {
      throw createError.NotFound('Sản phẩm quá số lượng'); // Ném lỗi 404
    } else {
      // Giảm số lượng kho xuống 1
      const new_stock = sku.stock - 1;
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
    // Tính tổng tiền của đơn hàng
    const total_amount = orderDetails.reduce((total, amount) => {
      return total + (amount.total_money ?? 0); // Cộng tổng tiền, nếu không có thì tính là 0
    }, 0);

    // Cập nhật tổng tiền cho đơn hàng
    const new_order = await Order.findByIdAndUpdate(
      order_id,
      {
        $set: { total_amount }, // Cập nhật tổng tiền
      },
      { new: true }, // Trả về tài liệu đã cập nhật
    );

    // Gửi phản hồi thành công với thông tin đơn hàng đã cập nhật
    return res.json({
      status: 200,
      message: 'Cập nhật thành công',
      data: new_order, // Dữ liệu của đơn hàng mới
    });
  } catch (error) {
    next(error);
  }
};

// TODO: Later
// hàm xử lý yêu cầu tìm đơn hàng theo sdt
export const getOrderByPhoneNumber: RequestHandler = async (req, res, next) => {
  try {
    // 1. Lấy các tham số truy vấn và thiết lập các giá trị mặc định nếu không có
    const _page = parseInt(req.query._page as string) || 1; // Trang hiện tại
    const _sort = (req.query._sort as string) || 'created_at'; // Tiêu chí sắp xếp
    const _order = (req.query._order as string) || 'desc'; // Thứ tự sắp xếp
    const _limit = parseInt(req.query._limit as string) || 6; // Số lượng bản ghi mỗi trang
    const search = req.query.search as string; // Từ khóa tìm kiếm
    const phone_number = req.body.phone_number as string; // Số điện thoại

    // 2. Xác định thứ tự sắp xếp (1: tăng dần, -1: giảm dần)
    const orderDirection = _order === 'desc' ? -1 : 1;

    // 3. Điều kiện lọc
    const conditions: Record<string, any> = {};
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
      select: ['-deleted', '-deleted_at'], // Loại trừ các trường không cần thiết
    };

    // 5. Tìm kiếm và phân trang dữ liệu
    const { docs, ...paginate } = await Order.paginate(conditions, options);

    // 6. Xử lý khi không tìm thấy đơn hàng
    if (!docs) {
      throw createError.NotFound('Không tìm thấy đơn hàng');
    }

    // 7. Lấy chi tiết từng đơn hàng trong danh sách kết quả
    const orderDetailsPromises = docs.map(async (result) => {
      const orderDetails = await Order_Detail.find({ order_id: result._id }); // Lấy chi tiết đơn hàng
      const newOrder = await Promise.all(
        orderDetails.map(async (item) => {
          const sku = await Sku.findOne({ _id: item.sku_id }).select(
            'name shared_url image', // Lấy tên, URL chia sẻ và hình ảnh
          );
          const newSku = sku?.toObject();
          return {
            ...item.toObject(),
            ...newSku, // Kết hợp chi tiết đơn hàng với thông tin sản phẩm (SKU)
          };
        }),
      );
      return {
        ...result.toObject(),
        orders: newOrder, // Đính kèm danh sách chi tiết sản phẩm vào đơn hàng
      };
    });

    // 8. Hoàn thành xử lý chi tiết từng đơn hàng
    const ordersWithDetails = await Promise.all(orderDetailsPromises);

    // 9. Trả về phản hồi JSON với danh sách đơn hàng và thông tin phân trang
    return res.json({
      status: 200,
      message: 'Lấy toàn bộ sản phẩm thành công',
      data: {
        items: ordersWithDetails,
        paginate,
      },
    });
  } catch (error) {
    next(error); // Bắt lỗi và chuyển đến middleware xử lý lỗi
  }
};

// TODO: Later
// hàm xử lý yêu cầu tìm đơn hàng theo user
export const getOrderByUserId: RequestHandler = async (req, res, next) => {
  try {
    const {
      _page = 1,
      _sort = 'created_at',
      _order = 'desc',
      _limit = 10,
      status,
      id,
    } = req.query;

    // Tạo điều kiện tìm kiếm
    const conditions: Record<string, any> = {};
    if (status) {
      conditions.status = status;
    }
    if (id) {
      conditions.userId = id;
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

    // Tìm kiếm đơn hàng
    const { docs, ...paginate } = await Order.paginate(conditions, options);

    // Kiểm tra nếu không tìm thấy đơn hàng
    if (docs.length <= 0) {
      throw createError.NotFound('Không tìm thấy đơn hàng');
    }

    // Tìm kiếm chi tiết đơn hàng
    const orderDetailsPromises = docs.map(async (item) => {
      const orderDetails = await Order_Detail.find({ order_id: item._id });

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
    });

    const ordersWithDetails = await Promise.all(orderDetailsPromises);

    return res.json({
      status: 200,
      message: 'Tìm thấy đơn hàng thành công',
      data: {
        items: ordersWithDetails,
        paginate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// TODO: Analyze
// Lấy danh sách đơn hàng với các tùy chọn tìm kiếm, sắp xếp và phân trang.
export const getAll: RequestHandler = async (req, res, next) => {
  const {
    _page = '1', // Trang mặc định là 1
    _sort = 'created_at', // Sắp xếp theo trường created_at mặc định
    _order = 'desc', // Thứ tự sắp xếp mặc định là giảm dần
    _limit = '10', // Giới hạn số bản ghi trả về là 10
    search, // Từ khóa tìm kiếm
    status, // Trạng thái đơn hàng
    date, // Ngày để lọc
    payment_method, // Phương thức thanh toán
    payment_status, // Trạng thái thanh toán
  } = req.query;

  const sortField = typeof _sort === 'string' ? _sort : 'created_at';
  // Khởi tạo đối tượng điều kiện tìm kiếm
  const conditions: any = {};

  // Nếu có từ khóa tìm kiếm, thêm điều kiện vào đối tượng
  if (search && typeof search === 'string') {
    // Kiểm tra nếu search là chuỗi
    conditions.$or = [
      { customer_name: { $regex: new RegExp(search, 'i') } }, // Sử dụng search khi chắc chắn là chuỗi
      {
        _id: mongoose.Types.ObjectId.isValid(search)
          ? new mongoose.Types.ObjectId(search)
          : null,
      },
    ];
  }

  // Thêm điều kiện trạng thái nếu có
  if (status) {
    conditions.status = status;
  }

  // Thêm điều kiện trạng thái thanh toán nếu có
  if (payment_status) {
    conditions.payment_status = payment_status;
  }

  // Nếu có tham số ngày, thiết lập điều kiện cho ngày tạo
  if (date && typeof date === 'string') {
    const targetMoment = moment(date); // Phân tích tham số ngày bằng moment
    const yearToSearch = targetMoment.year(); // Lấy năm
    const monthToSearch = targetMoment.month(); // Lấy tháng
    const dayToSearch = targetMoment.date(); // Lấy ngày

    // Thiết lập điều kiện để tìm các đơn hàng được tạo trong ngày đó
    conditions.created_at = {
      $gte: new Date(yearToSearch, monthToSearch, dayToSearch), // Ngày lớn hơn hoặc bằng
      $lt: new Date(yearToSearch, monthToSearch, dayToSearch + 1), // Ngày nhỏ hơn ngày hôm sau
    };
  }

  // Thêm điều kiện phương thức thanh toán nếu có
  if (payment_method) {
    conditions['payment_method.partnerCode'] = payment_method; // Tìm theo partnerCode
  }

  // Thiết lập tùy chọn cho truy vấn
  const options = {
    _page, // Trang hiện tại
    _limit, // Giới hạn số bản ghi
    sort: {
      // Thiết lập sắp xếp
      [sortField]: _order === 'desc' ? -1 : 1, // Nếu _order là 'desc', sắp xếp giảm dần, ngược lại sắp xếp tăng dần
    },
    select: ['-deleted', '-deleted_at'], // Loại bỏ các trường không cần thiết
  };

  try {
    // Thực hiện truy vấn và phân trang
    const { docs, ...paginate } = await Order.paginate(conditions, options);

    // Kiểm tra nếu không có đơn hàng nào được tìm thấy
    if (!docs.length) {
      return res
        .status(StatusCodes.NOT_FOUND) // Trả về mã trạng thái 404
        .json({ message: messagesError.NOT_FOUND });
    }

    // Lấy chi tiết cho từng đơn hàng
    const new_docs = await Promise.all(
      docs.map(async (item: any) => {
        const order_details = await Order_Detail.find({ order_id: item._id }); // Lấy chi tiết sản phẩm của đơn hàng
        const orders = item.toObject(); // Chuyển đổi đơn hàng sang đối tượng
        return {
          ...orders, // Kết hợp các trường của đơn hàng
          products: order_details, // Thêm thông tin sản phẩm vào đơn hàng
        };
      }),
    );

    // Gửi phản hồi thành công với dữ liệu đơn hàng và thông tin phân trang
    return res.json({
      status: 200, // Mã trạng thái 200
      message: messagesSuccess.GET_PRODUCT_SUCCESS, // Thông điệp thành công
      data: {
        items: new_docs, // Danh sách đơn hàng đã lấy
        paginate, // Thông tin phân trang
      },
    });
  } catch (error) {
    next(error); // Chuyển lỗi cho middleware xử lý lỗi
  }
};

// TODO: Later
export const getOne: RequestHandler = async (req, res, next) => {
  // 1. Lấy id từ tham số request
  const { id } = req.params;
  try {
    // 2. Kiểm tra xem id có tồn tại không
    if (!id) {
      return res.status(StatusCodes.NOT_FOUND).json; // Nếu không có id, trả về lỗi 404
    }

    // 3. Tìm kiếm đơn hàng trong cơ sở dữ liệu dựa trên id
    const order = await Order.findById(id).exec();

    // 4. Nếu không tìm thấy đơn hàng, trả về lỗi BAD_REQUEST
    if (!order) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.BAD_REQUEST });
    }

    // 5. Nếu tìm thấy, trả về thông tin chi tiết của đơn hàng
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_ORDER_SUCCESS,
      res: order, // Đính kèm đối tượng đơn hàng vào phản hồi
    });
  } catch (error) {
    next(error); // Nếu có lỗi, chuyển đến middleware xử lý lỗi
  }
};

// TODO: Later
// cập nhật trạng thái thanh toán của một đơn hàng
export const updatePaymentStatus: RequestHandler = async (req, res, next) => {
  try {
    // Lấy dữ liệu từ yêu cầu
    const { _id, orderInfo } = req.body;

    // Cập nhật trạng thái thanh toán cho đơn hàng
    const order = await Order.findByIdAndUpdate(_id, {
      $set: {
        payment_status: 'paid', // Cập nhật trạng thái thanh toán thành "paid"
        payment_method: orderInfo, // Cập nhật phương thức thanh toán với thông tin từ orderInfo
      },
    });

    // Kiểm tra xem đơn hàng có tồn tại hay không
    if (!order) {
      throw createError.NotFound('Không tìm thấy đơn hàng');
    }

    return res.json({
      status: 200,
      message: 'Thành công',
    });
  } catch (error) {
    next(error);
  }
};

// TODO: Later
// hàm xử lý yêu cầu xóa sản phẩm trong đơn hàng
export const deleteOneProduct_order: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { order_id, sku_id } = req.body; // Lấy order_id và sku_id từ yêu cầu

    // Tìm chi tiết đơn hàng tương ứng với order_id và sku_id
    const orderDetail = await Order_Detail.findOne({
      $and: [{ order_id }, { sku_id }],
    });

    // Kiểm tra nếu không tìm thấy chi tiết đơn hàng
    if (!orderDetail) {
      throw createError.NotFound('Không tìm thấy sản phẩm'); // Ném lỗi 404
    }

    // Kiểm tra số lượng sản phẩm
    if (orderDetail.quantity <= 1) {
      throw createError.BadRequest('Ít nhất là 1 sản phẩm'); // Ném lỗi 400 nếu số lượng <= 1
    }

    // Tìm SKU dựa trên sku_id
    const sku = await Sku.findById(sku_id);
    // Kiểm tra nếu không tìm thấy SKU
    if (!sku) {
      throw createError.NotFound('Không tìm thấy SKU'); // Ném lỗi 404
    }

    // Tăng số lượng kho lên 1
    const new_stock = sku.stock + 1;
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
    // Tính tổng tiền của đơn hàng
    const total_amount = orderDetails.reduce((total, amount) => {
      return total + (amount.total_money ?? 0); // Cộng tổng tiền, nếu không có thì tính là 0
    }, 0);

    // Cập nhật tổng tiền cho đơn hàng
    const new_order = await Order.findByIdAndUpdate(
      order_id,
      {
        $set: { total_amount }, // Cập nhật tổng tiền
      },
      { new: true }, // Trả về tài liệu đã cập nhật
    );

    return res.json({
      status: 200,
      message: 'Cập nhật thành công',
      data: new_order, // Dữ liệu của đơn hàng mới
    });
  } catch (error) {
    next(error);
  }
};

// TODO: Later
// Hàm xử lý lấy danh sách yêu cầu hoàn trả
export const getReturnedOrder: RequestHandler = async (req, res, next) => {
  try {
    // Lấy các tham số tìm kiếm từ query string
    const {
      _page = 1, // Trang hiện tại (mặc định là 1)
      _sort = 'created_at', // Trường để sắp xếp (mặc định là created_at)
      _order = 'desc', // Thứ tự sắp xếp (mặc định là giảm dần)
      _limit = 10, // Số lượng yêu cầu trả về trên một trang (mặc định là 10)
      search, // Tìm kiếm theo tên khách hàng
      is_confirm, // Tình trạng xác nhận
      date, // Ngày để tìm kiếm
    } = req.query as {
      _page?: number | string; // Trang hiện tại
      _sort?: string; // Trường sắp xếp
      _order?: 'asc' | 'desc'; // Thứ tự sắp xếp
      _limit?: number | string; // Số lượng yêu cầu trên một trang
      search?: string; // Từ khóa tìm kiếm
      is_confirm?: boolean; // Tình trạng xác nhận
      date?: string; // Ngày tìm kiếm
    };

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
      const targetMoment = moment(date); // Chuyển đổi chuỗi ngày thành đối tượng moment
      const yearToSearch = targetMoment.year(); // Năm cần tìm
      const monthToSearch = targetMoment.month(); // Tháng cần tìm
      const dayToSearch = targetMoment.date(); // Ngày cần tìm

      // Đặt điều kiện tìm kiếm theo khoảng thời gian
      conditions.created_at = {
        $gte: new Date(yearToSearch, monthToSearch, dayToSearch), // Ngày bắt đầu
        $lt: new Date(yearToSearch, monthToSearch, dayToSearch + 1), // Ngày kết thúc
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
    };

    // Lấy danh sách yêu cầu hoàn trả từ cơ sở dữ liệu
    const { docs, ...paginate } = await Returned.paginate(conditions, options);

    return res.json({
      status: 200,
      message: 'Thành công',
      data: {
        items: docs,
        paginate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// TODO: Later
// hàm xử lý yêu cầu xóa
export const deleteProduct_order: RequestHandler = async (req, res, next) => {
  try {
    // Lấy order_id và sku_id từ body của yêu cầu
    const { order_id, sku_id } = req.body;

    // Tìm và xóa chi tiết đơn hàng theo order_id và sku_id
    const orderDetail = await Order_Detail.findOneAndDelete({
      $and: [{ order_id: order_id }, { sku_id: sku_id }],
    });

    // Kiểm tra xem orderDetail có tồn tại không
    if (!orderDetail) {
      throw createError.NotFound('Không tìm thấy sản phẩm trong đơn hàng');
    }

    // Lấy tất cả chi tiết đơn hàng còn lại cho order_id
    const orderDetails = await Order_Detail.find({ order_id });

    // Tính tổng số tiền mới cho đơn hàng
    const total_amount = orderDetails.reduce((total, amount) => {
      return total + (amount.total_money || 0); // Đảm bảo tổng tiền không bị undefined
    }, 0);

    // Cập nhật tổng số tiền trong đơn hàng
    const new_order = await Order.findByIdAndUpdate(
      order_id,
      {
        $set: {
          total_amount: total_amount,
        },
      },
      { new: true },
    );

    return res.json({
      status: 200,
      message: 'Xóa sản phẩm thành công',
      data: new_order,
    });
  } catch (error) {
    next(error);
  }
};

// TODO: ????
// Lấy tất cả đơn hàng
export const getAllOrder: RequestHandler = async (req, res, next) => {
  try {
    // Lấy tất cả đơn hàng từ cơ sở dữ liệu
    const orders = await Order.find();

    // Sử dụng Promise.all để lấy chi tiết sản phẩm cho mỗi đơn hàng
    const new_docs = await Promise.all(
      orders.map(async (item) => {
        // Tìm chi tiết sản phẩm dựa trên order_id
        const order_details = await Order_Detail.find({ order_id: item._id });
        // Chuyển đổi đơn hàng sang đối tượng thông thường
        const order = item.toObject();
        // Trả về đơn hàng cùng với thông tin sản phẩm
        return {
          ...order,
          products: order_details,
        };
      }),
    );

    // Tính tổng số đơn hàng
    const total_order = new_docs.length;

    // Tạo mảng các tên khách hàng duy nhất
    const uniqueCustomers = [
      ...new Set(new_docs.map((item) => item.customer_name)),
    ];
    // Tính số lượng khách hàng duy nhất
    const total_user = uniqueCustomers.length;

    // Tính tổng số tiền từ tất cả các đơn hàng
    const total_order_money = new_docs
      .reduce((total, item) => total + item.total_amount, 0) // Tính tổng số tiền
      .toLocaleString(); // Định dạng thành chuỗi với dấu phân cách số

    // Tính tổng số sản phẩm trong tất cả các đơn hàng
    const total_order_product = new_docs.reduce(
      (total, item) => total + item.products.length,
      0,
    );

    // Gửi phản hồi thành công với thông tin đơn hàng
    return res.json({
      status: 200,
      message: 'Lấy toàn bộ đơn hàng thành công',
      data: {
        total_order, // Tổng số đơn hàng
        total_user, // Tổng số khách hàng duy nhất
        total_order_money, // Tổng số tiền
        total_order_product, // Tổng số sản phẩm
        new_docs, // Danh sách đơn hàng đã lấy
      },
    });
  } catch (error) {
    next(error);
  }
};

// TODO: Later
export const updateStatusDelivered: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    const ordered = await Order.findById(id);

    // Kiểm tra nếu đơn hàng không tồn tại
    if (!ordered) {
      throw createError.NotFound('Không tìm thấy đơn hàng');
    }

    // Kiểm tra trạng thái đơn hàng
    if (ordered.status !== 'pendingComplete') {
      throw createError.NotFound('Trạng thái đơn hàng không hợp lệ');
    }

    const order = await Order.findByIdAndUpdate(
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

    return res.json({
      status: 200,
      message: 'Cập nhật trạng thái thành công',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// TODO: Later
export const cancelOrder: RequestHandler = async (req, res, next) => {
  try {
    // 1. Lấy id từ tham số request
    const id = req.params.id;

    // 2. Tìm kiếm đơn hàng dựa trên id
    const ordered = await Order.findById(id);
    if (!ordered) {
      throw createError.NotFound('Không tìm thấy đơn hàng'); // Trả về lỗi nếu không tìm thấy đơn hàng
    }

    // 3. Kiểm tra trạng thái của đơn hàng
    if (ordered.status === 'cancelled') {
      throw createError.BadRequest('Đơn hàng đã được huỷ rồi');
    }
    if (ordered.status === 'delivering') {
      throw createError.BadRequest('Không thể huỷ đơn hàng đang giao');
    }
    if (ordered.status === 'returned') {
      throw createError.BadRequest('Không thể huỷ đơn hàng đang hoàn');
    }

    // 4. Cập nhật trạng thái đơn hàng thành "cancelled" và thêm chi tiết trạng thái
    const order = await Order.findByIdAndUpdate(
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

    if (!order) {
      throw createError.NotFound('Không tìm thấy đơn hàng'); // Kiểm tra lại sau khi cập nhật
    }

    // 5. Cập nhật lại số lượng hàng tồn kho của các SKU trong đơn hàng đã hủy

    const checkSkuStock = async (product: {
      sku_id: string;
      quantity: number;
    }) => {
      try {
        const sku = await Sku.findById(product.sku_id);
        if (!sku) throw createError.NotFound('Không tìm thấy SKU');

        const newStock = sku.stock + product.quantity; // Cộng lại số lượng vào tồn kho

        return await Sku.findByIdAndUpdate(
          product.sku_id,
          {
            $set: { stock: newStock },
          },
          { new: true },
        );
      } catch (error) {
        console.error(error);
      }
    };

    // 6. Lấy chi tiết đơn hàng và cập nhật tồn kho
    const orderDetails = await Order_Detail.find({ order_id: id });
    await Promise.all(
      orderDetails.map((item) =>
        checkSkuStock({
          sku_id: item.sku_id.toString(),
          quantity: item.quantity,
        }),
      ),
    );

    // 7. Trả về phản hồi thành công với thông tin đơn hàng đã hủy
    return res.json({ status: 200, message: 'Huỷ thành công', data: order });
  } catch (error) {
    next(error); // Chuyển tiếp lỗi đến middleware xử lý lỗi
  }
};

// TODO: Later
export const confirm_returnedOrder: RequestHandler = async (req, res, next) => {
  try {
    // 1. Lấy `id` từ tham số URL
    const { id } = req.params;

    // 2. Cập nhật trạng thái xác nhận hoàn trả
    const returned = await Returned.findByIdAndUpdate(
      id,
      {
        $set: {
          is_confirm: true,
        },
      },
      { new: true },
    );

    if (!returned) throw createError.BadRequest('Không tìm thấy đơn hàng'); // Trả về lỗi nếu không tìm thấy đơn hoàn trả

    // 3. Cập nhật trạng thái của đơn hàng thành "returned"
    const order = await Order.findByIdAndUpdate(
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

    // 4. Hàm kiểm tra và cập nhật kho cho từng sản phẩm trong đơn hàng đã hoàn trả
    const check_sku_stock = async (product: {
      sku_id: string;
      quantity: number;
    }) => {
      try {
        const sku = await Sku.findById(product.sku_id);
        if (!sku) throw createError.NotFound('Không tìm thấy SKU');

        const new_stock = sku.stock + product.quantity; // Tăng số lượng tồn kho cho sản phẩm
        await Sku.findByIdAndUpdate(product.sku_id, {
          $set: {
            stock: new_stock,
          },
        });
      } catch (error) {
        console.log(error);
      }
    };

    // 5. Lấy chi tiết các sản phẩm trong đơn hàng và cập nhật tồn kho
    const order_items = await Order_Detail.find({
      order_id: returned.order_id,
    }).select('sku_id quantity');

    await Promise.all(
      order_items.map((item) =>
        check_sku_stock({
          sku_id: item.sku_id.toString(),
          quantity: item.quantity,
        }),
      ),
    );

    // 6. Phản hồi thành công với thông báo
    return res.json({
      status: 200,
      message: 'Hoàn hàng thành công',
    });
  } catch (error) {
    next(error); // Chuyển lỗi tới middleware xử lý
  }
};

// TODO: Later
export const update_info_customer: RequestHandler = async (req, res, next) => {
  try {
    // Lấy ID đơn hàng từ tham số của request
    const id = req.params.id;

    // Lấy thông tin cần cập nhật từ body của request
    const {
      customer_name, // tên khách hàng
      phone_number, // số điện thoại khách hàng
      content, // nội dung đơn hàng
      shippingAddress, // địa chỉ giao hàng
      transportation_fee, // phí vận chuyển
    }: {
      customer_name: string; // kiểu dữ liệu của tên khách hàng
      phone_number: string; // kiểu dữ liệu của số điện thoại
      content: string; // kiểu dữ liệu của nội dung
      shippingAddress: string; // kiểu dữ liệu của địa chỉ giao hàng
      transportation_fee: number; // kiểu dữ liệu của phí vận chuyển
    } = req.body; // lấy thông tin từ body của request

    // Tìm kiếm đơn hàng bằng ID và lấy thông tin vận chuyển
    const order = await Order.findById(id).populate({
      path: 'shipping_info', // lấy thông tin từ bảng shipping_info
    });

    // Kiểm tra nếu không tìm thấy đơn hàng
    if (!order) {
      throw createError.NotFound('Không tìm thấy đơn hàng');
    }

    // Kiểm tra trạng thái đơn hàng để xác định xem có thể sửa đổi không
    if (
      order.status === 'cancelled' || // nếu đơn hàng đã bị hủy
      order.status === 'delivering' || // nếu đơn hàng đang được giao
      order.status === 'delivered' // nếu đơn hàng đã được giao
    ) {
      throw createError.BadRequest('Không thể sửa đơn hàng'); // ném lỗi nếu không thể sửa
    }

    // Cập nhật thông tin vận chuyển nếu đơn hàng đã được giao ("shipped")
    if (order.shipping_method === 'Shipping' && order.shipping_info?._id) {
      await Shipping.findByIdAndUpdate(
        order.shipping_info._id, // ID thông tin vận chuyển
        {
          $set: {
            shipping_address: shippingAddress, // cập nhật địa chỉ giao hàng
            transportation_fee, // cập nhật phí vận chuyển
          },
        },
        { new: true }, // trả về tài liệu đã cập nhật
      );
    }

    // Cập nhật thông tin khách hàng trong đơn hàng
    const updated_order = await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          customer_name, // cập nhật tên khách hàng
          phone_number, // cập nhật số điện thoại
          content, // cập nhật nội dung
        },
      },
      { new: true }, // trả về tài liệu đã cập nhật
    );

    // Trả về phản hồi thành công với thông tin đơn hàng đã được cập nhật
    return res.json({
      status: 200, // mã trạng thái thành công
      message: 'Đơn hàng đã được cập nhật', // thông điệp phản hồi
      data: updated_order, // dữ liệu đơn hàng đã được cập nhật
    });
  } catch (error) {
    // Gọi middleware xử lý lỗi nếu có lỗi xảy ra
    next(error);
  }
};

// TODO: Later
export const getAllShipping: RequestHandler = async (req, res, next) => {
  try {
    // Lấy thông tin phân trang và sắp xếp từ query của request
    const {
      _page = 1, // trang hiện tại, mặc định là 1
      _sort = 'createdAt', // trường để sắp xếp, mặc định là createdAt
      _order = 'asc', // thứ tự sắp xếp, mặc định là tăng dần
      _limit = 10, // số lượng bản ghi mỗi trang, mặc định là 10
    }: {
      _page?: number; // kiểu dữ liệu của trang hiện tại
      _sort?: string; // kiểu dữ liệu của trường sắp xếp
      _order?: string; // kiểu dữ liệu của thứ tự sắp xếp
      _limit?: number; // kiểu dữ liệu của số lượng bản ghi mỗi trang
    } = req.query; // lấy từ query của request

    // Lấy tên khách hàng từ query
    const customer_name = req.query.q as string | undefined;

    // Thiết lập các tùy chọn cho phân trang
    const options = {
      page: _page, // trang hiện tại
      limit: _limit, // số lượng bản ghi mỗi trang
      sort: {
        [_sort]: _order === 'desc' ? -1 : 1, // sắp xếp theo thứ tự giảm dần hoặc tăng dần
      },
    };

    // Nếu có tên khách hàng được chỉ định trong query
    if (customer_name) {
      // Thực hiện phân trang và tìm kiếm theo tên khách hàng
      const { docs, ...paginate } = await Order.paginate(
        {
          shipping_method: 'shipped', // chỉ lấy đơn hàng đã được giao
          customer_name: { $regex: customer_name, $options: 'i' }, // tìm kiếm tên khách hàng không phân biệt hoa thường
        },
        options, // áp dụng các tùy chọn phân trang
      );

      // Lấy chi tiết đơn hàng cho từng đơn hàng đã tìm thấy
      const new_docs = await Promise.all(
        docs.map(async (item) => {
          const order_details = await Order_Detail.find({ order_id: item._id }); // tìm chi tiết đơn hàng
          const orders = item.toObject(); // chuyển đổi tài liệu thành đối tượng JS
          return {
            ...orders, // giữ nguyên thông tin đơn hàng
            products: order_details, // thêm danh sách sản phẩm vào đơn hàng
          };
        }),
      );

      // Trả về phản hồi với dữ liệu đã lấy và thông tin phân trang
      return res.json({
        status: 200, // mã trạng thái thành công
        message: 'Lấy toàn bộ đơn hàng thành công', // thông điệp phản hồi
        data: {
          items: new_docs, // danh sách đơn hàng đã tìm thấy
          paginate, // thông tin phân trang
        },
      });
    } else {
      // Nếu không có tên khách hàng trong query
      // Thực hiện phân trang để lấy tất cả đơn hàng đã giao
      const { docs, ...paginate } = await Order.paginate(
        {
          shipping_method: 'shipped', // chỉ lấy đơn hàng đã được giao
        },
        options, // áp dụng các tùy chọn phân trang
      );

      // Lấy chi tiết đơn hàng cho từng đơn hàng đã tìm thấy
      const new_docs = await Promise.all(
        docs.map(async (item) => {
          const order_details = await Order_Detail.find({ order_id: item._id }); // tìm chi tiết đơn hàng
          const orders = item.toObject(); // chuyển đổi tài liệu thành đối tượng JS
          return {
            ...orders, // giữ nguyên thông tin đơn hàng
            products: order_details, // thêm danh sách sản phẩm vào đơn hàng
          };
        }),
      );

      // Trả về phản hồi với dữ liệu đã lấy và thông tin phân trang
      return res.json({
        status: 200, // mã trạng thái thành công
        message: 'Lấy toàn bộ đơn hàng thành công', // thông điệp phản hồi
        data: {
          items: new_docs, // danh sách đơn hàng đã tìm thấy
          paginate, // thông tin phân trang
        },
      });
    }
  } catch (error) {
    // Gọi middleware xử lý lỗi nếu có lỗi xảy ra
    next(error);
  }
};

// TODO: Later
export const getTokenPrintBills: RequestHandler = async (req, res, next) => {
  try {
    // Lấy order_id từ body của request
    const { order_id } = req.body;

    // Tìm đơn hàng theo order_id và lấy thông tin shipping_info
    const order = await Order.findById(order_id).populate('shipping_info');
    if (!order) {
      // Nếu không tìm thấy đơn hàng, ném lỗi NotFound
      throw createError.NotFound('Không tìm thấy đơn hàng');
    }

    // Kiểm tra nếu phương thức giao hàng là 'at_store'
    if (order.shipping_method === 'In-store') {
      // Nếu đơn hàng này là mua tại cửa hàng, ném lỗi BadRequest
      throw createError.BadRequest('Đơn hàng này mua tại cửa hàng');
    }

    // Kiểm tra trạng thái đơn hàng và phương thức giao hàng
    if (order.status === 'processing' && order.shipping_method === 'Shipping') {
      // Tìm thông tin giao hàng tương ứng với đơn hàng
      const shipping = await Shipping.findById(order.shipping_info?._id);
      if (!shipping) {
        // Nếu không tìm thấy thông tin giao hàng, ném lỗi NotFound
        throw createError.NotFound('Không tìm thấy thông tin giao hàng');
      }

      // Lấy danh sách chi tiết đơn hàng
      const order_details = await Order_Detail.find({ order_id });
      const new_order_details = await Promise.all(
        order_details.map(async (item) => {
          // Tìm thông tin SKU cho từng item trong đơn hàng
          const data_sku = await Sku.findById(item.sku_id);
          if (!data_sku) {
            // Nếu không tìm thấy SKU, ném lỗi NotFound
            throw createError.NotFound('Không tìm thấy SKU');
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
      );

      // Tách địa chỉ giao hàng thành các phần
      const address_detail = shipping.shipping_address.split(',');
      const address = address_detail.shift(); // Lấy địa chỉ chính
      // Lấy mã phường và quận từ địa chỉ chi tiết
      const code_ward_district = await getAddressLocation(
        address_detail.join(','),
      );

      // Chuẩn bị dữ liệu để tạo mã vận đơn
      const data_shipping = {
        to_name: order.customer_name,
        to_phone: order.phone_number.toString(),
        to_address: shipping.shipping_address,
        to_ward_code: code_ward_district?.ward_code,
        to_district_id: code_ward_district?.district,
        content: order.content,
        weight: 1000, // trọng lượng (gram)
        length: 15, // chiều dài (cm)
        width: 15, // chiều rộng (cm)
        height: 15, // chiều cao (cm)
        service_type_id: 2, // loại dịch vụ
        service_id: 53319, // ID dịch vụ
        payment_type_id: 1, // loại hình thanh toán
        required_note: 'CHOXEMHANGKHONGTHU', // ghi chú yêu cầu
        Items: new_order_details, // danh sách sản phẩm
        name: 'Đồ điện tử', // tên sản phẩm chung
        quantity: new_order_details.length, // số lượng sản phẩm
      };

      // Gửi yêu cầu tạo mã vận đơn đến API GHN
      const orderCode = await axios.post(
        'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create',
        data_shipping,
        {
          headers: {
            Token: process.env.GHN_SHOP_TOKEN as string, // token của shop
            ShopId: process.env.GHN_SHOP_ID as string, // ID của shop
            'Content-Type': 'application/json',
          },
        },
      );

      // Kiểm tra mã phản hồi từ API
      if (orderCode.data.code === 200) {
        // Nếu thành công, cập nhật thông tin mã vận đơn vào cơ sở dữ liệu
        await Shipping.findByIdAndUpdate(order.shipping_info?._id, {
          $set: {
            order_code: orderCode.data.data.order_code, // mã vận đơn
            estimated_delivery_date: orderCode.data.data.expected_delivery_time, // thời gian dự kiến giao hàng
          },
        });
      } else {
        // Nếu không thể tạo mã vận đơn, ném lỗi BadRequest
        throw createError.BadRequest('Không thể tạo mã vận đơn');
      }
    }

    // Lấy thông tin giao hàng để lấy token hóa đơn
    const shipping = await Shipping.findById(order.shipping_info?._id);
    const token_bill = await getTokenPrintBill(shipping?.order_code ?? '');

    // Kiểm tra mã phản hồi từ việc lấy token hóa đơn
    if (token_bill.code !== 200) {
      // Nếu không tìm thấy token, ném lỗi BadRequest
      throw createError.BadRequest('Không tìm thấy token hoá đơn');
    }

    // Trả về phản hồi thành công với token hóa đơn
    return res.json({
      status: token_bill.code,
      message: token_bill.message,
      data: token_bill.data?.token,
    });
  } catch (error) {
    // Gọi middleware xử lý lỗi nếu có lỗi xảy ra
    next(error);
  }
};
