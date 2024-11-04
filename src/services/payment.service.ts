import axios from 'axios';
import { StatusCodes } from '@/http-status-codes/build/cjs';
import { sortObject } from '@/utils/payments';
import crypto from 'crypto';
import moment from 'moment';
import qs from 'qs';
import logger from '@/utils/logger';
import {
  ZALO_PAY_APP_ID,
  ZALO_PAY_ENDPOINT,
  ZALO_PAY_KEY_1,
  ZALO_PAY_KEY_2,
} from '@/utils/env';
import { AppError } from '@/utils/errorHandle';

export type CreateVnPayInput = {
  amount: number;
  backCode: string;
  socket: string;
  ip: string;
  language?: string;
};

const createVnPayService = async (data: CreateVnPayInput): Promise<string> => {
  const { amount = 100000, backCode = 'NCB', language = 'vn', ip } = data;
  const date = new Date();

  const orderId = moment(date).format('DDHHmmss');
  const createDate = moment(date).format('YYYYMMDDHHmmss');

  const tmnCode = process.env.VN_PAY_TMN_CODE || '';
  const secretKey = process.env.VN_PAY_HASH_SECRET || '';
  const vnpUrl = process.env.VN_PAY_URL || '';
  const returnUrl = process.env.VN_PAY_RETURN_URL || '';

  const vnp_Params: { [key: string]: string | number } = {
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

  if (backCode) vnp_Params['vnp_BankCode'] = backCode;

  const sortedParams = sortObject(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  sortedParams['vnp_SecureHash'] = signed;

  return `${vnpUrl}?${qs.stringify(sortedParams, { encode: false })}`;
};

export type VnPayCallbackInput = Record<string, string>;
const vnPayCallbackService = async (vnpParams: VnPayCallbackInput) => {
  const secureHash = vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];

  const sortedParams = sortObject(vnpParams);
  const signData = qs.stringify(sortedParams, { encode: false });

  const secretKey = process.env.VN_PAY_HASH_SECRET || '';
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  if (secureHash === signed) {
    return {
      message: 'success',
      code: vnpParams['vnp_ResponseCode'],
      statusCode: StatusCodes.OK,
    };
  } else {
    return {
      message: 'Checksum failed',
      code: '97',
      statusCode: StatusCodes.NOT_FOUND,
    };
  }
};

export type VnPayStatusInput = {
  [key: string]: string;
};
const vnPayStatusService = async (
  vnpParams: VnPayStatusInput,
  secretKey: string,
) => {
  const secureHash = vnpParams['vnp_SecureHash'];
  const rspCode = vnpParams['vnp_ResponseCode'];
  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];

  const sortedParams = sortObject(vnpParams);
  const signData = qs.stringify(sortedParams, { encode: false });

  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const checkOrderId = true; // Thay đổi kiểm tra thực tế trong CSDL
  const checkAmount = true; // Thay đổi kiểm tra thực tế trong CSDL

  if (secureHash === signed) {
    if (checkOrderId) {
      if (checkAmount) {
        if (rspCode === '00') {
          return {
            RspCode: '00',
            Message: 'Success',
            statusCode: StatusCodes.OK,
          };
        } else {
          return {
            RspCode: '00',
            Message: 'Failure',
            statusCode: StatusCodes.OK,
          };
        }
      } else {
        return {
          RspCode: '04',
          Message: 'Amount invalid',
          statusCode: StatusCodes.OK,
        };
      }
    } else {
      return {
        RspCode: '01',
        Message: 'Order not found',
        statusCode: StatusCodes.OK,
      };
    }
  } else {
    return {
      RspCode: '97',
      Message: 'Checksum failed',
      statusCode: StatusCodes.OK,
    };
  }
};

export type MomoPaymentInput = {
  amount: string;
  info?: string;
  orderId?: string;
};

const createMomoService = async (paymentData: MomoPaymentInput) => {
  const accessKey = process.env.MOMO_ACCESS_KEY || '';
  const secretKey = process.env.MOMO_SECRET_KEY || '';
  const partnerCode = 'MOMO';
  const redirectUrl = process.env.MOMO_REDIRECT_URL || '';
  const ipnUrl = process.env.MOMO_IPN_URL || '';
  const requestType = 'payWithMethod';
  const amount = paymentData.amount || '1000';
  const orderInfo = paymentData.info || 'pay with MoMo';
  const orderId = paymentData.orderId || `${partnerCode}${Date.now()}`;
  const requestId = orderId;
  const extraData = '';
  const orderGroupId = '';
  const autoCapture = true;
  const lang = 'vi';

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = {
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
  };

  const result = await axios.post(
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
  } else {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Invalid response from MoMo API: ${result.data.message || 'Unknown error'}`,
    );
  }
};

type MomoStatusInput = {
  orderId: string;
};

const momoStatusService = async ({ orderId }: MomoStatusInput) => {
  const accessKey: string = process.env.MOMO_ACCESS_KEY || '';
  const secretKey: string = process.env.MOMO_SECRET_KEY || '';
  const partnerCode: string = 'MOMO';

  const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${orderId}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = {
    orderId: orderId,
    partnerCode: partnerCode,
    requestId: orderId,
    signature: signature,
    lang: 'vi',
  };

  const options = {
    method: 'POST',
    url: 'https://test-payment.momo.vn/v2/gateway/api/query',
    headers: {
      'Content-Type': 'application/json',
    },
    data: requestBody,
  };

  const { data } = await axios(options);
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
  };
  const items: { id: number; name: string; price: number }[] = [];
  const transID = Math.floor(Math.random() * 1000000);

  const order = {
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
  };

  const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
  const mac = crypto
    .createHmac('sha256', process.env.ZALO_PAY_KEY_1 || '')
    .update(data)
    .digest('hex');

  const requestData = { ...order, mac };

  const result = await axios.post(process.env.ZALO_PAY_ENDPOINT || '', null, {
    params: requestData,
  });

  if (result && result.data && result.data.order_url) {
    return { payUrl: result.data.order_url };
  } else {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Invalid response from ZaloPay API',
    );
  }
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
    const { data, mac } = callbackData;

    // Tạo MAC từ data với secretKey để xác minh tính hợp lệ của callback
    const calculatedMac = crypto
      .createHmac('sha256', ZALO_PAY_KEY_2 || '')
      .update(data)
      .digest('hex');

    console.log('Calculated MAC:', calculatedMac);

    if (mac !== calculatedMac) {
      // Callback không hợp lệ
      result.return_code = -1;
      result.return_message = 'mac not equal';
    } else {
      // Thanh toán thành công
      const dataJson = JSON.parse(data);
      console.log(
        "Update order's status = success where app_trans_id =",
        dataJson['app_trans_id'],
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
  };

  const data = `${postData.app_id}|${postData.app_trans_id}|${ZALO_PAY_KEY_1}`; // appid|app_trans_id|key1

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
  vnPayCallbackService,
  vnPayStatusService,
  momoStatusService,
  createZaloPayService,
  zaloPayCallbackSerice,
  zaloPayStatusService,
};
