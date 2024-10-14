import {
  MOMO_ACCESS_KEY,
  MOMO_IPN_URL,
  MOMO_REDIRECT_URL,
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
import { sortObject } from '@/utils/payments';
import axios from 'axios';
import * as crypto from 'crypto';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import qs from 'qs';

//* VNPay
// Hàm tạo yêu cầu thanh toán VNPay
const createVnPay: RequestHandler = async (req, res, next) => {
  try {
    process.env.TZ = 'Asia/Ho_Chi_Minh';

    let date: Date = new Date();
    let createDate: string = moment(date).format('YYYYMMDDHHmmss');

    let ipAddr: string | undefined =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      req.ip;

    let tmnCode: string = VN_PAY_TMN_CODE as string;

    let secretKey: string = VN_PAY_HASH_SECRET as string;

    let vnpUrl: string = VN_PAY_URL as string;

    let returnUrl: string = VN_PAY_RETURN_URL as string;

    let orderId: string = moment(date).format('DDHHmmss');

    let amount: number = req.body.amount || 100000;

    let bankCode: string = req.body.backCode || 'NCB';

    let locale: string = req.body.language || 'vn';

    let currCode: string = 'VND';

    let vnp_Params: { [key: string]: string | number } = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr || '';
    vnp_Params['vnp_CreateDate'] = createDate;

    if (bankCode) {
      vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    let signData = qs.stringify(vnp_Params, { encode: false });

    let hmac = crypto.createHmac('sha512', secretKey);

    let signed: string = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    vnp_Params['vnp_SecureHash'] = signed;

    vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

    res.status(StatusCodes.OK).json({ res: vnpUrl });
  } catch (error) {
    next(error);
  }
};

const vnPayCallback: RequestHandler = async (req, res, next) => {
  try {
    let vnp_Params = req.query as Record<string, string>;
    
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    let tmnCode: string = VN_PAY_TMN_CODE as string;
    let secretKey: string = VN_PAY_HASH_SECRET as string;

    let signData: string = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac('sha512', secretKey);

    let signed: string = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    if (secureHash === signed) {
      //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua

      res.status(200).json({
        mesage: 'success',
        code: vnp_Params['vnp_ResponseCode'],
      });
    } else {
      return res.status(400).json({
        code: '97',
        message: 'Checksum failed',
      });
    }
  } catch (error) {
    next(error);
  }
};

const vnPayStatus: RequestHandler = async (req, res, next) => {
  try {
    let vnp_Params = req.query as { [key: string]: string };
    let secureHash = vnp_Params['vnp_SecureHash'];

    let orderId = vnp_Params['vnp_TxnRef'];
    let rspCode = vnp_Params['vnp_ResponseCode'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    let secretKey: string = VN_PAY_HASH_SECRET as string;

    let signData: string = qs.stringify(vnp_Params, { encode: false });

    let hmac = crypto.createHmac('sha512', secretKey);
    let signed: string = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    let paymentStatus = '0'; // Giả sử '0' là trạng thái khởi tạo giao dịch, chưa có IPN. Trạng thái này được lưu khi yêu cầu thanh toán chuyển hướng sang Cổng thanh toán VNPAY tại đầu khởi tạo đơn hàng.
    //let paymentStatus = '1'; // Giả sử '1' là trạng thái thành công bạn cập nhật sau IPN được gọi và trả kết quả về nó
    //let paymentStatus = '2'; // Giả sử '2' là trạng thái thất bại bạn cập nhật sau IPN được gọi và trả kết quả về nó

    let checkOrderId = true; // Mã đơn hàng "giá trị của vnp_TxnRef" VNPAY phản hồi tồn tại trong CSDL của bạn
    let checkAmount = true; // Kiểm tra số tiền "giá trị của vnp_Amout/100" trùng khớp với số tiền của đơn hàng trong CSDL của bạn
    if (secureHash === signed) {
      //kiểm tra checksum
      if (checkOrderId) {
        if (checkAmount) {
          if (paymentStatus == '0') {
            //kiểm tra tình trạng giao dịch trước khi cập nhật tình trạng thanh toán
            if (rspCode == '00') {
              //thanh cong
              //paymentStatus = '1'
              // Ở đây cập nhật trạng thái giao dịch thanh toán thành công vào CSDL của bạn
              res.status(200).json({ RspCode: '00', Message: 'Success' });
            } else {
              //that bai
              //paymentStatus = '2'
              // Ở đây cập nhật trạng thái giao dịch thanh toán thất bại vào CSDL của bạn
              res.status(200).json({ RspCode: '00', Message: 'Success' });
            }
          } else {
            res.status(200).json({
              RspCode: '02',
              Message: 'This order has been updated to the payment status',
            });
          }
        } else {
          res.status(200).json({ RspCode: '04', Message: 'Amount invalid' });
        }
      } else {
        res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      }
    } else {
      res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
    }
  } catch (error) {
    next(error);
  }
};

//* MoMo
const createMomo: RequestHandler = async (req, res, next) => {
  //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
  //parameters
  const accessKey: string = MOMO_ACCESS_KEY as string;
  const secretKey: string = MOMO_SECRET_KEY as string;
  const orderInfo: string = 'pay with MoMo';
  const partnerCode: string = 'MOMO';
  const redirectUrl: string = MOMO_REDIRECT_URL as string;
  const ipnUrl: string = MOMO_IPN_URL as string;
  const requestType: string = 'payWithMethod';
  const amount: string = '1000';
  const orderId: string = `${partnerCode}${new Date().getTime()}`;
  const requestId: string = orderId;
  const extraData: string = '';
  const orderGroupId: string = '';
  const autoCapture: boolean = true;
  const lang: string = 'vi';

  //before sign HMAC SHA256 with format
  //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  //puts raw signature
  console.log('--------------------RAW SIGNATURE----------------');
  console.log(rawSignature);
  //signature

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');
  console.log('--------------------SIGNATURE----------------');
  console.log(signature);

  //json object send to MoMo endpoint
  const requestBody = JSON.stringify({
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
  });

  const options = {
    method: 'POST',
    url: 'https://test-payment.momo.vn/v2/gateway/api/create',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
    },
    data: requestBody,
  };

  let result;
  try {
    result = await axios(options);
    return res.status(200).json(result.data);
  } catch (error) {
    return next(error);
  }
};

const momoCallback: RequestHandler = async (req, res) => {
  console.log('callback:');
  console.log(req.body);

  return res.status(200).json(req.body);
};

//kiểm tra trạng thái giao dịch
const momoStatus: RequestHandler = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    const accessKey = 'F8BBA842ECF85';
    const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=MOMO&requestId=${orderId}`;

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = JSON.stringify({
      orderId: orderId,
      partnerCode: 'MOMO',
      requestId: orderId,
      signature: signature,
      lang: 'vi',
    });

    //option for axios
    const options = {
      method: 'POST',
      url: 'https://test-payment.momo.vn/v2/gateway/api/query',
      headers: {
        'Content-Type': 'application/json',
      },
      data: requestBody,
    };

    let result = await axios(options);
    return res.status(200).json(result.data);
  } catch (error) {
    next(error);
  }
};

//* Zalo
const createZaloPay: RequestHandler = async (req, res, next) => {
  const embed_data = {
    //sau khi hoàn tất thanh toán sẽ đi vào link này (thường là link web thanh toán thành công của mình)
    redirecturl: '/',
  };

  const items: { id: number; name: string; price: number }[] = [];
  const transID = Math.floor(Math.random() * 1000000);

  const order = {
    app_id: ZALO_PAY_APP_ID,
    app_trans_id: `${moment().format('YYMMDD')}_${transID}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
    app_user: 'user123',
    app_time: Date.now(), // miliseconds
    item: JSON.stringify(items),
    embed_data: JSON.stringify(embed_data),
    amount: 50000,
    //khi thanh toán xong, zalopay server sẽ POST đến url này để thông báo cho server của mình
    //Chú ý: cần dùng ngrok để public url thì Zalopay Server mới call đến được
    callback_url:
      'https://f396-2402-800-61ae-ad78-ac2c-6cfa-4402-79e0.ngrok-free.app/callback',
    description: `Lazada - Payment for the order #${transID}`,
    bank_code: '',
  };

  // appid|app_trans_id|appuser|amount|apptime|embeddata|item
  const data =
    ZALO_PAY_APP_ID +
    '|' +
    order.app_trans_id +
    '|' +
    order.app_user +
    '|' +
    order.amount +
    '|' +
    order.app_time +
    '|' +
    order.embed_data +
    '|' +
    order.item;

  (order as any).mac = crypto
    .createHmac('sha256', ZALO_PAY_KEY_1 as string)
    .update(data)
    .digest('hex');
  try {
    const result = await axios.post(ZALO_PAY_ENDPOINT as string, null, {
      params: order,
    });

    return res.status(200).json(result.data);
  } catch (error) {
    next(error);
  }
};

const zaloPayCallback: RequestHandler = async (req, res, next) => {
  let result = {} as Record<string, unknown>;
  try {
    let dataStr = req.body.data;
    let reqMac = req.body.mac;

    let mac = crypto
      .createHmac('sha256', ZALO_PAY_KEY_2 as string)
      .update(dataStr)
      .digest('hex');
    console.log('mac =', mac);

    // kiểm tra callback hợp lệ (đến từ ZaloPay server)
    if (reqMac !== mac) {
      // callback không hợp lệ
      result.return_code = -1;
      result.return_message = 'mac not equal';
    } else {
      // thanh toán thành công
      // merchant cập nhật trạng thái cho đơn hàng ở đây
      let dataJson = JSON.parse(dataStr);
      console.log(
        "update order's status = success where app_trans_id =",
        dataJson['app_trans_id']
      );

      result.return_code = 1;
      result.return_message = 'success';
      // thông báo kết quả cho ZaloPay server
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const zaloPayStatus: RequestHandler = async (req, res, next) => {
  let postData = {
    app_id: ZALO_PAY_APP_ID as string,
    app_trans_id: '<app_trans_id>',
  };

  let data =
    postData.app_id + '|' + postData.app_trans_id + '|' + ZALO_PAY_KEY_1; // appid|app_trans_id|key1

  (postData as any).mac = crypto
    .createHmac('sha256', ZALO_PAY_KEY_1 as string)
    .update(data)
    .digest('hex');

  let postConfig = {
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
    return res.status(200).json(result.data);
    /**
       * kết quả mẫu
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
    next(error);
  }
};

export {
  createVnPay,
  vnPayCallback,
  vnPayStatus,
  createMomo,
  momoCallback,
  momoStatus,
  createZaloPay,
  zaloPayCallback,
  zaloPayStatus,
};
