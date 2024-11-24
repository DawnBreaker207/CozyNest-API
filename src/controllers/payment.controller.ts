import {
  MOMO_ACCESS_KEY,
  MOMO_SECRET_KEY,
  VN_PAY_HASH_SECRET,
  VN_PAY_RETURN_URL,
  VN_PAY_TMN_CODE,
  VN_PAY_URL,
  ZALO_PAY_APP_ID,
  ZALO_PAY_ENDPOINT,
  ZALO_PAY_KEY_1,
  ZALO_PAY_KEY_2,
} from '@/utils/env';
import logger from '@/utils/logger';
import { sortObject } from '@/utils/payments';
import axios from 'axios';
import * as crypto from 'crypto';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import qs from 'qs';

//* VNPay
// Hàm tạo yêu cầu thanh toán VNPay
export const createVnPay: RequestHandler = async (req, res, next) => {
  /**
   * @param {number} req.body.amount Param amount input
   * @param {string} req.body.backCode Param backCode input
   * @param {string} req.body.socket Param socket input
   * @param {string} req.body.ip Param ip input
   */
  try {
    process.env.TZ = 'Asia/Ho_Chi_Minh';

    const date: Date = new Date(),
      createDate: string = moment(date).format('YYYYMMDDHHmmss'),
      ipAddr: string | undefined =
        (req.headers['x-forwarded-for'] as string) ||
        req.socket.remoteAddress ||
        req.ip,
      tmnCode: string = VN_PAY_TMN_CODE as string,
      secretKey: string = VN_PAY_HASH_SECRET as string;

    let vnpUrl: string = VN_PAY_URL as string;

    const returnUrl: string = VN_PAY_RETURN_URL as string,
      orderId: string = moment(date).format('DDHHmmss'),
      amount: number = req.body.amount || 100000,
      bankCode: string = req.body.backCode || 'NCB',
      locale: string = req.body.language || 'vn',
      currCode: string = 'VND';

    let vnp_Params: { [key: string]: string | number } = {};
    vnp_Params.vnp_Version = '2.1.0';
    vnp_Params.vnp_Command = 'pay';
    vnp_Params.vnp_TmnCode = tmnCode;
    vnp_Params.vnp_Locale = locale;
    vnp_Params.vnp_CurrCode = currCode;
    vnp_Params.vnp_TxnRef = orderId;
    vnp_Params.vnp_OrderInfo = `Thanh toan cho ma GD:${orderId}`;
    vnp_Params.vnp_OrderType = 'other';
    vnp_Params.vnp_Amount = amount * 100;
    vnp_Params.vnp_ReturnUrl = returnUrl;
    vnp_Params.vnp_IpAddr = ipAddr || '';
    vnp_Params.vnp_CreateDate = createDate;

    if (bankCode) {
      vnp_Params.vnp_BankCode = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false }),
      hmac = crypto.createHmac('sha512', secretKey),
      signed: string = hmac
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');

    vnp_Params.vnp_SecureHash = signed;

    vnpUrl += `?${qs.stringify(vnp_Params, { encode: false })}`;

    res.status(StatusCodes.OK).json({ res: vnpUrl });
    return { payUrl: vnpUrl };
  } catch (error) {
    logger.log('error', `Catch error in create VnPay: ${error}`);
    next(error);
  }
};

export const vnPayCallback: RequestHandler = async (req, res, next) => {
  try {
    let vnp_Params = req.query as Record<string, string>;

    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    vnp_Params = sortObject(vnp_Params);

    // Const tmnCode: string = VN_PAY_TMN_CODE as string;
    const secretKey: string = VN_PAY_HASH_SECRET as string,
      signData: string = qs.stringify(vnp_Params, { encode: false }),
      hmac = crypto.createHmac('sha512', secretKey),
      signed: string = hmac
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');

    if (secureHash === signed) {
      //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua

      res.status(StatusCodes.OK).json({
        mesage: 'success',
        code: vnp_Params.vnp_ResponseCode,
      });
    } else {
      return res.status(StatusCodes.NOT_FOUND).json({
        code: '97',
        message: 'Checksum failed',
      });
    }
  } catch (error) {
    logger.log('error', `Catch error in check VnPay callback: ${error}`);
    next(error);
  }
};

export const vnPayStatus: RequestHandler = async (req, res, next) => {
  try {
    let vnp_Params = req.query as { [key: string]: string };
    const secureHash = vnp_Params.vnp_SecureHash,
      // Const orderId = vnp_Params['vnp_TxnRef'];
      rspCode = vnp_Params.vnp_ResponseCode;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    vnp_Params = sortObject(vnp_Params);

    const secretKey: string = VN_PAY_HASH_SECRET as string,
      signData: string = qs.stringify(vnp_Params, { encode: false }),
      hmac = crypto.createHmac('sha512', secretKey),
      signed: string = hmac
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex'),
      paymentStatus = '0', // Giả sử '0' là trạng thái khởi tạo giao dịch, chưa có IPN. Trạng thái này được lưu khi yêu cầu thanh toán chuyển hướng sang Cổng thanh toán VNPAY tại đầu khởi tạo đơn hàng.
      //Let paymentStatus = '1'; // Giả sử '1' là trạng thái thành công bạn cập nhật sau IPN được gọi và trả kết quả về nó
      //Let paymentStatus = '2'; // Giả sử '2' là trạng thái thất bại bạn cập nhật sau IPN được gọi và trả kết quả về nó

      checkOrderId = true, // Mã đơn hàng "giá trị của vnp_TxnRef" VNPAY phản hồi tồn tại trong CSDL của bạn
      checkAmount = true; // Kiểm tra số tiền "giá trị của vnp_Amout/100" trùng khớp với số tiền của đơn hàng trong CSDL của bạn
    if (secureHash === signed) {
      //Kiểm tra checksum
      if (checkOrderId) {
        if (checkAmount) {
          if (paymentStatus == '0') {
            //Kiểm tra tình trạng giao dịch trước khi cập nhật tình trạng thanh toán
            if (rspCode == '00') {
              //Thanh cong
              //PaymentStatus = '1'
              // Ở đây cập nhật trạng thái giao dịch thanh toán thành công vào CSDL của bạn
              res
                .status(StatusCodes.OK)
                .json({ RspCode: '00', Message: 'Success' });
            } else {
              //That bai
              //PaymentStatus = '2'
              // Ở đây cập nhật trạng thái giao dịch thanh toán thất bại vào CSDL của bạn
              res
                .status(StatusCodes.OK)
                .json({ RspCode: '00', Message: 'Success' });
            }
          } else {
            res.status(StatusCodes.OK).json({
              RspCode: '02',
              Message: 'This order has been updated to the payment status',
            });
          }
        } else {
          res
            .status(StatusCodes.OK)
            .json({ RspCode: '04', Message: 'Amount invalid' });
        }
      } else {
        res
          .status(StatusCodes.OK)
          .json({ RspCode: '01', Message: 'Order not found' });
      }
    } else {
      res
        .status(StatusCodes.OK)
        .json({ RspCode: '97', Message: 'Checksum failed' });
    }
  } catch (error) {
    logger.log('error', `Catch error in check VnPay status: ${error}`);
    next(error);
  }
};

//* MoMo

export const createMomo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const accessKey: string = process.env.MOMO_ACCESS_KEY || '',
    secretKey: string = process.env.MOMO_SECRET_KEY || '',
    partnerCode: string = 'MOMO',
    redirectUrl: string = process.env.MOMO_REDIRECT_URL || '',
    ipnUrl: string = process.env.MOMO_IPN_URL || '',
    requestType: string = 'payWithMethod',
    amount: string = req.body.amount || '1000',
    orderInfo: string = req.body.info || 'pay with MoMo',
    orderId: string =
      req.body.orderId || `${partnerCode}${new Date().getTime()}`,
    requestId: string = orderId,
    extraData: string = '',
    orderGroupId: string = '',
    autoCapture: boolean = true,
    lang: string = 'vi',
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
    };

  try {
    const result = await axios.post(
      'https://test-payment.momo.vn/v2/gateway/api/create',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    // In phản hồi để kiểm tra cấu trúc dữ liệu
    console.log('MoMo API Response:', result.data);

    if (result && result.data && result.data.resultCode === 0) {
      // Trả về `payUrl` nếu phản hồi thành công
      res.status(StatusCodes.OK).json({ res: result.data });
    } else {
      throw new Error(
        `Invalid response from MoMo API: ${result.data.message || 'Unknown error'}`,
      );
    }
  } catch (error: any) {
    logger.log('error', `Catch error in create momo: ${error}`);
    console.error(
      'Error while calling MoMo API:',
      error.response ? error.response.data : error.message,
    );
    next(error);
  }
};

export const momoCallback: RequestHandler = async (req, res) => {
  console.log('callback:');
  console.log(req.body);

  return res.status(StatusCodes.OK).json({ res: req.body });
};

//Kiểm tra trạng thái giao dịch
export const momoStatus: RequestHandler = async (req, res, next) => {
  try {
    const { orderId } = req.body,
      accessKey: string = MOMO_ACCESS_KEY as string,
      secretKey: string = MOMO_SECRET_KEY as string,
      rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=MOMO&requestId=${orderId}`,
      signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex'),
      requestBody = JSON.stringify({
        orderId,
        partnerCode: 'MOMO',
        requestId: orderId,
        signature,
        lang: 'vi',
      }),
      //Option for axios
      options = {
        method: 'POST',
        url: 'https://test-payment.momo.vn/v2/gateway/api/query',
        headers: {
          'Content-Type': 'application/json',
        },
        data: requestBody,
      },
      result = await axios(options);
    res.status(StatusCodes.OK).json({ res: result.data });
  } catch (error) {
    logger.log('error', `Catch error in check momo status: ${error}`);
    next(error);
  }
};

//* Zalo
export const createZaloPay: RequestHandler = async (req, res, next) => {
  const embed_data = {
      //Sau khi hoàn tất thanh toán sẽ đi vào link này (thường là link web thanh toán thành công của mình)
      redirecturl: '/',
    },
    items: { id: number; name: string; price: number }[] = [],
    transID = Math.floor(Math.random() * 1000000),
    order = {
      app_id: ZALO_PAY_APP_ID,
      app_trans_id: `${moment().format('YYMMDD')}_${transID}`, // Translation missing: vi.docs.shared.sample_code.comments.app_trans_id
      app_user: req.body.user || 'user123',
      app_time: Date.now(), // Miliseconds
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount: req.body.amount || 50000,
      //Khi thanh toán xong, zalopay server sẽ POST đến url này để thông báo cho server của mình
      //Chú ý: cần dùng ngrok để public url thì Zalopay Server mới call đến được
      callback_url:
        'https://f396-2402-800-61ae-ad78-ac2c-6cfa-4402-79e0.ngrok-free.app/callback',
      description: `Lazada - Payment for the order #${transID}`,
      bank_code: '',
    },
    // Appid|app_trans_id|appuser|amount|apptime|embeddata|item
    data = `${ZALO_PAY_APP_ID}|${order.app_trans_id}|${order.app_user}|${
      order.amount
    }|${order.app_time}|${order.embed_data}|${order.item}`;

  (order as any).mac = crypto
    .createHmac('sha256', ZALO_PAY_KEY_1 as string)
    .update(data)
    .digest('hex');
  try {
    const result = await axios.post(ZALO_PAY_ENDPOINT as string, null, {
      params: order,
    });
    if (result && result.data && result.data.order_url) {
      return res.status(StatusCodes.CREATED).json({
        res: result.data.order_url, // Trả về `order_url` nếu thành công
      });
    }
    throw new Error('Invalid response from ZaloPay API');
  } catch (error) {
    logger.log('error', `Catch error in create zalo pay: ${error}`);
    next(error);
  }
};

export const zaloPayCallback: RequestHandler = async (req, res, next) => {
  const result = {} as Record<string, unknown>;
  try {
    const dataStr = req.body.data,
      reqMac = req.body.mac,
      mac = crypto
        .createHmac('sha256', ZALO_PAY_KEY_2 as string)
        .update(dataStr)
        .digest('hex');
    console.log('mac =', mac);

    // Kiểm tra callback hợp lệ (đến từ ZaloPay server)
    if (reqMac !== mac) {
      // Callback không hợp lệ
      result.return_code = -1;
      result.return_message = 'mac not equal';
    } else {
      // Thanh toán thành công
      // Merchant cập nhật trạng thái cho đơn hàng ở đây
      const dataJson = JSON.parse(dataStr);
      console.log(
        "update order's status = success where app_trans_id =",
        dataJson.app_trans_id,
      );

      result.return_code = 1;
      result.return_message = 'success';
      // Thông báo kết quả cho ZaloPay server
    }
    res.status(StatusCodes.OK).json({ res: result });
  } catch (error) {
    logger.log('error', `Catch error in check zalo pay callback: ${error}`);
    next(error);
  }
};

export const zaloPayStatus: RequestHandler = async (req, res, next) => {
  const postData = {
      app_id: ZALO_PAY_APP_ID as string,
      app_trans_id: '<app_trans_id>',
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
    console.log(result.data);
    res.status(StatusCodes.OK).json({ res: result.data });
    /**
       * Kết quả mẫu
        {
          "return_code": 1, // 1 : Thành công, 2 : Thất bại, 3 : Đơn hàng chưa thanh toán hoặc giao dịch đang xử lý
          "return_message": "",
          "sub_return_code": 1,
          "sub_return_message": "",
          "is_processing": false,
          "amount": 50000,
          "zp_trans_id": 240331000000175,
          "server_time": 1711857138483,
          "discount_amount": 0
        }
      */
  } catch (error) {
    logger.log('error', `Catch error in check zalo pay status: ${error}`);
    next(error);
  }
};
