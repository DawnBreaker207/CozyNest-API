import axios from 'axios';
import config from 'config';
import * as crypto from 'crypto';
import CryptoJS from 'crypto-js';
import { RequestHandler } from 'express';
import qs from 'qs';

//* VNPay
// Hàm sắp xếp đối tượng theo thứ tự alphabet
const sortObject = (obj: Record<string, any>): Record<string, string> => {
  let sorted: Record<string, string> = {};
  let keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  }

  return sorted;
};

const vnPayReturn: RequestHandler = async (req, res, next) => {
  try {
    let vnp_Params = req.query as Record<string, string>;

    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    let tmnCode: string = config.get('vnp_TmnCode');
    let secretKey: string = config.get('vnp_HashSecret');

    let signData: string = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac('sha512', secretKey);

    let signed: string = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    if (secureHash === signed) {
      //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua

      res.render('success', { code: vnp_Params['vnp_ResponseCode'] });
    } else {
      res.render('success', { code: '97' });
    }
  } catch (error) {
    next(error);
  }
};
const vnPayIpn: RequestHandler = async (req, res, next) => {
  try {
    let vnp_Params = req.query as { [key: string]: string };
    let secureHash = vnp_Params['vnp_SecureHash'];

    let orderId = vnp_Params['vnp_TxnRef'];
    let rspCode = vnp_Params['vnp_ResponseCode'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    let secretKey: string = config.get('vnp_HashSecret');

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

//* Momo
const handleCallbackMomo: RequestHandler = async (req, res) => {
  console.log('callback:');
  console.log(req.body);

  return res.status(200).json(req.body);
};

//kiểm tra trạng thái giao dịch
const checkStatusMomo: RequestHandler = async (req, res, next) => {
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

const configzalo = {
  app_id: '2554',
  key1: 'sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn',
  key2: 'trMrHtvjo6myautxDUiAcYsVtaeQ8nhf',
  endpoint: 'https://sb-openapi.zalopay.vn/v2/create',
};

//* ZaloPay
//
const handleCallbackZaloPay: RequestHandler = async (req, res, next) => {
  let result = {} as Record<string, unknown>;
  console.log(req.body);
  try {
    let dataStr = req.body.data;
    let reqMac = req.body.mac;

    let mac = CryptoJS.HmacSHA256(dataStr, configzalo.key2).toString();
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

const checkStatusZaloPay: RequestHandler = async (req, res, next) => {
  let postData = {
    app_id: configzalo.app_id,
    app_trans_id: '<app_trans_id>',
  };

  let data =
    postData.app_id + '|' + postData.app_trans_id + '|' + configzalo.key1; // appid|app_trans_id|key1
  (postData as any).mac = CryptoJS.HmacSHA256(data, configzalo.key1).toString();

  let postConfig = {
    method: 'post',
    url: configzalo.endpoint,
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
  configzalo,
  sortObject,
  vnPayReturn,
  vnPayIpn,
  handleCallbackMomo,
  checkStatusMomo,
  handleCallbackZaloPay,
  checkStatusZaloPay,
};
