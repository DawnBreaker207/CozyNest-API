import { configzalo, sortObject } from '@/utils/payments';
import axios from 'axios';
import * as crypto from 'crypto';
import { RequestHandler } from 'express';
import moment from 'moment';
import qs from 'qs';
import config from 'config';
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

    let tmnCode: string = config.get('vnp_TmnCode');

    // let secretKey: string = config.get('vnp_HashSecret');
    let secretKey: string = 'J81W79Q18JMFS7H71ZB9RQI5CUVZ571U';

    let vnpUrl: string = config.get('vnp_Url');
    let returnUrl: string = config.get('vnp_ReturnUrl');
    let orderId: string = moment(date).format('DDHHmmss');
    // let amount: number = req.body.amount;
    let amount: number = req.body.amount || 1000;
    // let bankCode: string = req.body.bankCode;
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

    res.redirect(vnpUrl);
  } catch (error) {
    next(error);
  }
};

//* MoMo
const createMomo: RequestHandler = async (req, res, next) => {
  //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
  //parameters
  const accessKey = 'F8BBA842ECF85';
  const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
  const orderInfo = 'pay with MoMo';
  const partnerCode = 'MOMO';
  const redirectUrl =
    'https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT3xNT01PMTcyNzc2ODQzNTU0Mw&s=425503bbad6dda6a15a62bfa11d2a365def1511da16b47a6b3f70843760d3c1d';
  const ipnUrl =
    '   https://f396-2402-800-61ae-ad78-ac2c-6cfa-4402-79e0.ngrok-free.app/callback';
  const requestType = 'payWithMethod';
  const amount = '1000';
  const orderId = `${partnerCode}${new Date().getTime()}`;
  const requestId = orderId;
  const extraData = '';
  const orderGroupId = '';
  const autoCapture = true;
  const lang = 'vi';

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

//* Zalo
const createZalo: RequestHandler = async (req, res, next) => {
  const embed_data = {
    //sau khi hoàn tất thanh toán sẽ đi vào link này (thường là link web thanh toán thành công của mình)
    redirecturl: '/',
  };

  const items: { id: number; name: string; price: number }[] = [];
  const transID = Math.floor(Math.random() * 1000000);

  const order = {
    app_id: configzalo.app_id,
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
    configzalo.app_id +
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
    .createHmac('sha256', configzalo.key1)
    .update(data)
    .digest('hex');
  try {
    const result = await axios.post(configzalo.endpoint, null, {
      params: order,
    });

    return res.status(200).json(result.data);
  } catch (error) {
    next(error);
  }
};
export { createMomo, createVnPay, createZalo };
