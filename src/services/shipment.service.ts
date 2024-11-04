import axios from 'axios';

import { ShipmentType } from '@/interfaces/Order';
import { SHIPMENT_SHOP, TOKEN_SHIPMENT } from '@/utils/env';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';
import { StatusCodes } from 'http-status-codes';

const createDeliveryOrderService = async (orderData: ShipmentType) => {
  // Kiểm tra các trường bắt buộc
  if (
    // Tên hàng hoá
    !orderData.product_name ||
    // Tên người nhận
    !orderData.to_name ||
    // Số điện thoại người nhận
    !orderData.to_phone ||
    // Địa chỉ người nhận
    !orderData.to_address ||
    // Trọng lượng
    !orderData.weight ||
    // Ghi chú bắt buộc
    !orderData.required_note
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Thiếu thông tin bắt buộc');
  }

  // const URL = `${GHN_API_BASE_URL}/shipping-order/create`;
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
    return response.data;
  } catch (error) {
    logger.log('error', `Catch error in create delivery order: ${error}`);
    throw new AppError(StatusCodes.BAD_REQUEST, `Errors: ${error}`);
  }
};
const calShippingFeeService = async (shippingData: ShipmentType) => {
  const URL = `https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee`;
  try {
    const response = await axios.post(URL, shippingData, {
      headers: {
        Token: TOKEN_SHIPMENT,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.data instanceof Error) {
      logger.log('error', `Catch error in calc shipping fee: ${error.message}`);
      throw new AppError(StatusCodes.BAD_REQUEST, `Errors: ${error.message}`);
    }
  }
};
const trackOrderService = async (orderCode: string) => {
  const URL = `https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail`;
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
    return response.data;
  } catch (error) {
    logger.log('error', `Catch error in track order: ${error}`);
    throw new AppError(StatusCodes.BAD_REQUEST, `Errors: ${error}`);
  }
};
export { createDeliveryOrderService, calShippingFeeService, trackOrderService };
