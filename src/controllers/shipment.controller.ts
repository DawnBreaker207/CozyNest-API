import { SHIPMENT_SHOP, TOKEN_SHIPMENT } from '@/utils/env';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';
import axios from 'axios';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const GHN_API_BASE_URL =
  'https://dev-online-gateway.ghn.vn/shiip/public-api/v2';
// Gọi API tạo đơn hàng và xử lý request/response từ client
export const createDeliveryOrder: RequestHandler = async (req, res, next) => {
  /**
   * @product_name : Optional value id
   * @to_name : Optional value id
   * @to_phone : Optional value id
   * @weight : Optional value id
   * @required_note : Optional value id
   */
  const orderData = req.body;
  // Kiểm tra các trường bắt buộc
  if (
    !orderData.product_name || // Tên hàng hoá
    !orderData.to_name || // Tên người nhận
    !orderData.to_phone || // Số điện thoại người nhận
    !orderData.to_address || // Địa chỉ người nhận
    !orderData.weight || // Trọng lượng
    !orderData.required_note // Ghi chú bắt buộc
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error:
        'Thiếu thông tin bắt buộc: Name, ToName, ToPhone, ToAddress, Weight, RequiredNote',
    });
  }

  // Const URL = `${GHN_API_BASE_URL}/shipping-order/create`;
  const URL =
    'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create';
  try {
    const response = await axios.post(URL, orderData, {
      headers: {
        Token: TOKEN_SHIPMENT,
        'shop-id': SHIPMENT_SHOP,
        'Content-Type': 'application/json',
      },
    });
    res.status(StatusCodes.OK).json({ res: response.data });
  } catch (error) {
    logger.log('error', `Catch error in create delivery order: ${error}`);
    next(error);
  }
};

// Gọi API tính phí vận chuyển và xử lý request/response từ client
export const calShippingFee: RequestHandler = async (req, res, next) => {
  const shippingData = req.body,
    URL = `${GHN_API_BASE_URL}/shipping-order/fee`;

  try {
    const response = await axios.post(URL, shippingData, {
      headers: {
        Token: TOKEN_SHIPMENT,
        'Content-Type': 'application/json',
      },
    });
    res.status(StatusCodes.OK).json({ res: response.data });
  } catch (error: unknown) {
    console.log(error);
    if (error instanceof Error) {
      logger.log('error', `Catch error in calculate shipping fee: ${error}`);
      next(
        new AppError(
          StatusCodes.BAD_REQUEST,
          error.message || 'Error calculating shipping fee',
        ),
      );
    }
  }
};

// Gọi API theo dõi đơn hàng và xử lý request/response từ client
export const trackOrder: RequestHandler = async (req, res, next) => {
  const { orderCode } = req.params,
    URL = `${GHN_API_BASE_URL}/shipping-order/detail`;

  try {
    const response = await axios.post(
      URL,
      { order_code: orderCode },
      {
        headers: {
          Token: TOKEN_SHIPMENT,
          'Content-Type': 'application/json',
        },
      },
    );
    res.status(StatusCodes.OK).json({ res: response.data });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.log('error', `Catch error in track order: ${error}`);
      next(
        new AppError(
          StatusCodes.BAD_REQUEST,
          error?.message || 'Error tracking order',
        ),
      );
    }
  }
};
