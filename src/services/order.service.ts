import { StatusCodes } from '@/http-status-codes/build/cjs';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';
import { createMomoService, createVnPayService } from './payment.service';
import { Shipping } from '@/models/Order';

// Utils functions
const buildPaymentMethod = (method: string) => {
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

const createShippingInfo = async (
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

const checkPaymentMethod = async (paymentMethod: any, inputData: any) => {
  // TODO: Update create payment controller to services
  // Tùy theo phương thức thanh toán (`momo`, `zalopay`, `vnpay`), gọi hàm tạo liên kết thanh toán và lưu liên kết vào `payUrl`
  let payUrl: string | undefined;
  try {
    switch (paymentMethod) {
      case 'momo':
        const momoResponse: any = await createMomoService(inputData);
        payUrl = momoResponse?.payUrl ?? '';
        break;

      case 'zalopay':
        const zalopayResponse: any = await createVnPayService(inputData);
        payUrl = zalopayResponse?.payUrl ?? '';
        break;

      case 'vnpay':
        const vnpayResponse: any = await createVnPayService(inputData);
        payUrl = vnpayResponse?.payUrl ?? '';
        break;

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

export { buildPaymentMethod, checkPaymentMethod, createShippingInfo };
