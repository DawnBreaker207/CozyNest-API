import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

const GHN_API_BASE_URL =
  'https://dev-online-gateway.ghn.vn/shiip/public-api/v2';

// Gọi API tính phí vận chuyển và xử lý request/response từ client
export const calculateShippingFee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const shippingData = req.body;
  const endpoint = `${GHN_API_BASE_URL}/shipping-order/fee`;

  try {
    const response = await axios.post(endpoint, shippingData, {
      headers: {
        Token: '0c2c6b3c-8797-11ef-8e53-0a00184fe694',
        'Content-Type': 'application/json',
      },
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    next(
      new Error(
        error.response?.data?.message || 'Error calculating shipping fee'
      )
    );
  }
};

// Gọi API tạo đơn hàng và xử lý request/response từ client
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const orderData = req.body;
  console.log(orderData);
  // Kiểm tra các trường bắt buộc
  if (
    !orderData.product_name || // Tên hàng hoá
    !orderData.to_name || // Tên người nhận
    !orderData.to_phone || // Số điện thoại người nhận
    !orderData.to_address || // Địa chỉ người nhận
    !orderData.weight || // Trọng lượng
    !orderData.required_note // Ghi chú bắt buộc
  ) {
    return res.status(400).json({
      error:
        'Thiếu thông tin bắt buộc: Name, ToName, ToPhone, ToAddress, Weight, RequiredNote',
    });
  }

  const endpoint = `${GHN_API_BASE_URL}/shipping-order/create`;
  // 'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create';

  try {
    const response = await axios.post(endpoint, orderData, {
      headers: {
        Token: '0c2c6b3c-8797-11ef-8e53-0a00184fe694',
        'shop-id': '194743',
        'Content-Type': 'application/json',
      },
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    next(new Error(error.response?.data?.message || 'Error creating order'));
  }
};

// Gọi API theo dõi đơn hàng và xử lý request/response từ client
export const trackOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { orderCode } = req.params;
  const endpoint = `${GHN_API_BASE_URL}/shipping-order/detail`;

  try {
    const response = await axios.post(
      endpoint,
      { order_code: orderCode },
      {
        headers: {
          Token: '0c2c6b3c-8797-11ef-8e53-0a00184fe694',
          'Content-Type': 'application/json',
        },
      }
    );
    res.status(200).json(response.data);
  } catch (error: any) {
    next(new Error(error.response?.data?.message || 'Error tracking order'));
  }
};
