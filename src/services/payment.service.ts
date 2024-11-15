import { StatusCodes } from 'http-status-codes';
import {
  ZALO_PAY_APP_ID,
  ZALO_PAY_ENDPOINT,
  ZALO_PAY_KEY_1,
  ZALO_PAY_KEY_2,
} from '@/utils/env';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';
import { sortObject } from '@/utils/payments';
import axios from 'axios';
import crypto from 'crypto';
import moment from 'moment';
import qs from 'qs';

export type CreateVnPayInput = {
  amount: number;
  backCode: string;
  socket: string;
  ip: string;
  language?: string;
};

const createVnPayService = async (data: CreateVnPayInput): Promise<string> => {
  const { amount = 100000, backCode = 'NCB', language = 'vn', ip } = data,
    date = new Date(),
    orderId = moment(date).format('DDHHmmss'),
    createDate = moment(date).format('YYYYMMDDHHmmss'),
    tmnCode = process.env.VN_PAY_TMN_CODE || '',
    secretKey = process.env.VN_PAY_HASH_SECRET || '',
    vnpUrl = process.env.VN_PAY_URL || '',
    returnUrl = process.env.VN_PAY_RETURN_URL || '',
    vnp_Params: { [key: string]: string | number } = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: language,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan cho ma GD: ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ip,
      vnp_CreateDate: createDate,
    };

  if (backCode) vnp_Params.vnp_BankCode = backCode;

  const sortedParams = sortObject(vnp_Params),
    signData = qs.stringify(sortedParams, { encode: false }),
    hmac = crypto.createHmac('sha512', secretKey),
    signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  sortedParams.vnp_SecureHash = signed;

  return `${vnpUrl}?${qs.stringify(sortedParams, { encode: false })}`;
};

export type VnPayCallbackInput = Record<string, string>;
const vnPayCallbackService = async (vnpParams: VnPayCallbackInput) => {
  const secureHash = vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHashType;

  const sortedParams = sortObject(vnpParams),
    signData = qs.stringify(sortedParams, { encode: false }),
    secretKey = process.env.VN_PAY_HASH_SECRET || '',
    hmac = crypto.createHmac('sha512', secretKey),
    signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  if (secureHash === signed) {
    return {
      message: 'success',
      code: vnpParams.vnp_ResponseCode,
      statusCode: StatusCodes.OK,
    };
  }
  return {
    message: 'Checksum failed',
    code: '97',
    statusCode: StatusCodes.NOT_FOUND,
  };
};

export type VnPayStatusInput = {
  [key: string]: string;
};
const vnPayStatusService = async (
  vnpParams: VnPayStatusInput,
  secretKey: string,
) => {
  const secureHash = vnpParams.vnp_SecureHash,
    rspCode = vnpParams.vnp_ResponseCode;
  delete vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHashType;

  const sortedParams = sortObject(vnpParams),
    signData = qs.stringify(sortedParams, { encode: false }),
    hmac = crypto.createHmac('sha512', secretKey),
    signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex'),
    checkOrderId = true, // Thay đổi kiểm tra thực tế trong CSDL
    checkAmount = true; // Thay đổi kiểm tra thực tế trong CSDL

  if (secureHash === signed) {
    if (checkOrderId) {
      if (checkAmount) {
        if (rspCode === '00') {
          return {
            RspCode: '00',
            Message: 'Success',
            statusCode: StatusCodes.OK,
          };
        }
        return {
          RspCode: '00',
          Message: 'Failure',
          statusCode: StatusCodes.OK,
        };
      }
      return {
        RspCode: '04',
        Message: 'Amount invalid',
        statusCode: StatusCodes.OK,
      };
    }
    return {
      RspCode: '01',
      Message: 'Order not found',
      statusCode: StatusCodes.OK,
    };
  }
  return {
    RspCode: '97',
    Message: 'Checksum failed',
    statusCode: StatusCodes.OK,
  };
};

export type MomoPaymentInput = {
  amount: string;
  info?: string;
  orderId?: string;
};

const createMomoService = async (paymentData: MomoPaymentInput) => {
  const accessKey = process.env.MOMO_ACCESS_KEY || '',
    secretKey = process.env.MOMO_SECRET_KEY || '',
    partnerCode = 'MOMO',
    redirectUrl = process.env.MOMO_REDIRECT_URL || '',
    ipnUrl = process.env.MOMO_IPN_URL || '',
    requestType = 'payWithMethod',
    amount = paymentData.amount || '1000',
    orderInfo = paymentData.info || 'pay with MoMo',
    orderId = paymentData.orderId || `${partnerCode}${Date.now()}`,
    requestId = orderId,
    extraData = '',
    orderGroupId = '',
    autoCapture = true,
    lang = 'vi',
    rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`,
    signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex'),
    requestBody = {
      partnerCode,
      partnerName: 'Test',
      storeId: 'MomoTestStore',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      autoCapture,
      extraData,
      orderGroupId,
      signature,
    },
    result = await axios.post(
      'https://test-payment.momo.vn/v2/gateway/api/create',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

  if (result && result.data && result.data.resultCode === 0) {
    return { payUrl: result.data.payUrl };
  }
  throw new AppError(
    StatusCodes.BAD_REQUEST,
    `Invalid response from MoMo API: ${result.data.message || 'Unknown error'}`,
  );
};

type MomoStatusInput = {
  orderId: string;
};

const momoStatusService = async ({ orderId }: MomoStatusInput) => {
  const accessKey: string = process.env.MOMO_ACCESS_KEY || '',
    secretKey: string = process.env.MOMO_SECRET_KEY || '',
    partnerCode: string = 'MOMO',
    rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${orderId}`,
    signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex'),
    requestBody = {
      orderId,
      partnerCode,
      requestId: orderId,
      signature,
      lang: 'vi',
    },
    options = {
      method: 'POST',
      url: 'https://test-payment.momo.vn/v2/gateway/api/query',
      headers: {
        'Content-Type': 'application/json',
      },
      data: requestBody,
    },
    { data } = await axios(options);
  return data;
};
export type ZaloPayCreateInput = {
  user?: string;
  amount: number;
};

const createZaloPayService = async ({
  user = 'user123',
  amount = 50000,
}: ZaloPayCreateInput) => {
  const embed_data = {
      redirecturl: '/',
    },
    items: { id: number; name: string; price: number }[] = [],
    transID = Math.floor(Math.random() * 1000000),
    order = {
      app_id: process.env.ZALO_PAY_APP_ID,
      app_trans_id: `${moment().format('YYMMDD')}_${transID}`,
      app_user: user,
      app_time: Date.now(),
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount,
      callback_url:
        'https://f396-2402-800-61ae-ad78-ac2c-6cfa-4402-79e0.ngrok-free.app/callback',
      description: `Lazada - Payment for the order #${transID}`,
      bank_code: '',
    },
    data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`,
    mac = crypto
      .createHmac('sha256', process.env.ZALO_PAY_KEY_1 || '')
      .update(data)
      .digest('hex'),
    requestData = { ...order, mac },
    result = await axios.post(process.env.ZALO_PAY_ENDPOINT || '', null, {
      params: requestData,
    });

  if (result && result.data && result.data.order_url) {
    return { payUrl: result.data.order_url };
  }
  throw new AppError(
    StatusCodes.BAD_REQUEST,
    'Invalid response from ZaloPay API',
  );
};

interface ZaloPayCallbackData {
  data: string;
  mac: string;
}

interface ZaloPayCallbackResult {
  return_code: number;
  return_message: string;
}

const zaloPayCallbackSerice = async (
  callbackData: ZaloPayCallbackData,
): Promise<ZaloPayCallbackResult> => {
  const result: ZaloPayCallbackResult = { return_code: 0, return_message: '' };

  try {
    const { data, mac } = callbackData,
      // Tạo MAC từ data với secretKey để xác minh tính hợp lệ của callback
      calculatedMac = crypto
        .createHmac('sha256', ZALO_PAY_KEY_2 || '')
        .update(data)
        .digest('hex');

    logger.log('info', 'Calculated MAC:', calculatedMac);

    if (mac !== calculatedMac) {
      // Callback không hợp lệ
      result.return_code = -1;
      result.return_message = 'mac not equal';
    } else {
      // Thanh toán thành công
      const dataJson = JSON.parse(data);
      logger.log(
        'info',
        "Update order's status = success where app_trans_id =",
        dataJson.app_trans_id,
      );

      // Cập nhật trạng thái đơn hàng ở đây nếu cần

      result.return_code = 1;
      result.return_message = 'success';
    }
  } catch (error) {
    logger.log('error', `Catch error in check ZaloPay callback: ${error}`);
    result.return_code = -1;
    result.return_message = 'internal error';
  }

  return result;
};

interface ZaloPayStatusResponse {
  return_code: number;
  return_message: string;
  sub_return_code: number;
  sub_return_message: string;
  is_processing: boolean;
  amount: number;
  zp_trans_id: string;
  server_time: number;
  discount_amount: number;
}

const zaloPayStatusService = async (
  appTransId: string = '<app_trans_id>',
): Promise<ZaloPayStatusResponse | null> => {
  const postData = {
      app_id: ZALO_PAY_APP_ID || '',
      app_trans_id: appTransId,
    },
    data = `${postData.app_id}|${postData.app_trans_id}|${ZALO_PAY_KEY_1}`; // Appid|app_trans_id|key1

  (postData as any).mac = crypto
    .createHmac('sha256', ZALO_PAY_KEY_1 as string)
    .update(data)
    .digest('hex');

  const postConfig = {
    method: 'post',
    url: ZALO_PAY_ENDPOINT,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: qs.stringify(postData),
  };

  try {
    const result = await axios(postConfig);
    return result.data; // Trả về dữ liệu kết quả từ API
  } catch (error) {
    logger.log('error', `Error checking ZaloPay status: ${error}`);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Failed to check ZaloPay status',
    );
  }
};

export {
  createMomoService,
  createVnPayService,
  createZaloPayService,
  momoStatusService,
  vnPayCallbackService,
  vnPayStatusService,
  zaloPayCallbackSerice,
  zaloPayStatusService,
};
