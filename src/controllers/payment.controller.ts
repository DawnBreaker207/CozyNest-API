import axios from "axios";
import config from "config";
import * as crypto from "crypto";
import CryptoJS from "crypto-js";
import { RequestHandler } from "express";
import { Request, Response, NextFunction } from "express";
import moment from "moment";
const qs = require("qs");

// Hàm tạo yêu cầu thanh toán VNPay
const vnpayCreate: RequestHandler = async (req, res, next) => {
  try {
    process.env.TZ = "Asia/Ho_Chi_Minh";

    let date: Date = new Date();
    let createDate: string = moment(date).format("YYYYMMDDHHmmss");

    let ipAddr: string | undefined =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      req.ip;

    let tmnCode: string = config.get("vnp_TmnCode");
    let secretKey: string = config.get("vnp_HashSecret");
    let vnpUrl: string = config.get("vnp_Url");
    let returnUrl: string = config.get("vnp_ReturnUrl");
    let orderId: string = moment(date).format("DDHHmmss");
    let amount: number = req.body.amount;
    let bankCode: string = req.body.bankCode;

    let locale: string = req.body.language || "vn";
    let currCode: string = "VND";

    let vnp_Params: { [key: string]: string | number } = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = locale;
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr || "";
    vnp_Params["vnp_CreateDate"] = createDate;

    if (bankCode) {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    let signData = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed: string = hmac
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + qs.stringify(vnp_Params, { encode: false });

    res.redirect(vnpUrl);
  } catch (error) {
    next(error);
  }
};

// Hàm sắp xếp đối tượng theo thứ tự alphabet
const sortObject = (obj: Record<string, any>): Record<string, string> => {
  let sorted: Record<string, string> = {};
  let keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }

  return sorted;
};

const vnpayReturn: RequestHandler = async (req, res, next) => {
  try {
    let vnp_Params = req.query as Record<string, string>;

    let secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    let tmnCode: string = config.get("vnp_TmnCode");
    let secretKey: string = config.get("vnp_HashSecret");

    let signData: string = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);

    let signed: string = hmac
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    if (secureHash === signed) {
      //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua

      res.render("success", { code: vnp_Params["vnp_ResponseCode"] });
    } else {
      res.render("success", { code: "97" });
    }
  } catch (error) {
    next(error);
  }
};
const vnpayIpn: RequestHandler = async (req, res, next) => {
  try {
    let vnp_Params = req.query as { [key: string]: string };
    let secureHash = vnp_Params["vnp_SecureHash"];

    let orderId = vnp_Params["vnp_TxnRef"];
    let rspCode = vnp_Params["vnp_ResponseCode"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    let secretKey: string = config.get("vnp_HashSecret");

    let signData: string = qs.stringify(vnp_Params, { encode: false });

    let hmac = crypto.createHmac("sha512", secretKey);
    let signed: string = hmac
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    let paymentStatus = "0"; // Giả sử '0' là trạng thái khởi tạo giao dịch, chưa có IPN. Trạng thái này được lưu khi yêu cầu thanh toán chuyển hướng sang Cổng thanh toán VNPAY tại đầu khởi tạo đơn hàng.
    //let paymentStatus = '1'; // Giả sử '1' là trạng thái thành công bạn cập nhật sau IPN được gọi và trả kết quả về nó
    //let paymentStatus = '2'; // Giả sử '2' là trạng thái thất bại bạn cập nhật sau IPN được gọi và trả kết quả về nó

    let checkOrderId = true; // Mã đơn hàng "giá trị của vnp_TxnRef" VNPAY phản hồi tồn tại trong CSDL của bạn
    let checkAmount = true; // Kiểm tra số tiền "giá trị của vnp_Amout/100" trùng khớp với số tiền của đơn hàng trong CSDL của bạn
    if (secureHash === signed) {
      //kiểm tra checksum
      if (checkOrderId) {
        if (checkAmount) {
          if (paymentStatus == "0") {
            //kiểm tra tình trạng giao dịch trước khi cập nhật tình trạng thanh toán
            if (rspCode == "00") {
              //thanh cong
              //paymentStatus = '1'
              // Ở đây cập nhật trạng thái giao dịch thanh toán thành công vào CSDL của bạn
              res.status(200).json({ RspCode: "00", Message: "Success" });
            } else {
              //that bai
              //paymentStatus = '2'
              // Ở đây cập nhật trạng thái giao dịch thanh toán thất bại vào CSDL của bạn
              res.status(200).json({ RspCode: "00", Message: "Success" });
            }
          } else {
            res.status(200).json({
              RspCode: "02",
              Message: "This order has been updated to the payment status",
            });
          }
        } else {
          res.status(200).json({ RspCode: "04", Message: "Amount invalid" });
        }
      } else {
        res.status(200).json({ RspCode: "01", Message: "Order not found" });
      }
    } else {
      res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
    }
  } catch (error) {
    next(error);
  }
};

//Momo
export const createMomo: RequestHandler = async (req, res, next) => {
  //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
  //parameters
  const accessKey = "F8BBA842ECF85";
  const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  const orderInfo = "pay with MoMo";
  const partnerCode = "MOMO";
  const redirectUrl =
    "https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT3xNT01PMTcyNzc2ODQzNTU0Mw&s=425503bbad6dda6a15a62bfa11d2a365def1511da16b47a6b3f70843760d3c1d";
  const ipnUrl =
    "   https://f396-2402-800-61ae-ad78-ac2c-6cfa-4402-79e0.ngrok-free.app/callback";
  const requestType = "payWithMethod";
  const amount = "1000";
  const orderId = `${partnerCode}${new Date().getTime()}`;
  const requestId = orderId;
  const extraData = "";
  const orderGroupId = "";
  const autoCapture = true;
  const lang = "vi";

  //before sign HMAC SHA256 with format
  //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  //puts raw signature
  console.log("--------------------RAW SIGNATURE----------------");
  console.log(rawSignature);
  //signature
  const crypto = require("crypto");
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");
  console.log("--------------------SIGNATURE----------------");
  console.log(signature);

  //json object send to MoMo endpoint
  const requestBody = JSON.stringify({
    partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
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
    method: "POST",
    url: "https://test-payment.momo.vn/v2/gateway/api/create",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody),
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
export const handleCallbackMomo: RequestHandler = async (req, res) => {
  console.log("callback:");
  console.log(req.body);

  return res.status(200).json(req.body);
};

//kiểm tra trạng thái giao dịch
export const handleTransactionStatus: RequestHandler = async (
  req: any,
  res: any,
  next: any
) => {
  const { orderId } = req.body;
  const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  const accessKey = "F8BBA842ECF85";
  const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=MOMO&requestId=${orderId}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = JSON.stringify({
    orderId: orderId,
    partnerCode: "MOMO",
    requestId: orderId,
    signature: signature,
    lang: "vi",
  });

  //option for axios
  const options = {
    method: "POST",
    url: "https://test-payment.momo.vn/v2/gateway/api/query",
    headers: {
      "Content-Type": "application/json",
    },
    data: requestBody,
  };

  let result = await axios(options);
  return res.status(200).json(result.data);
};

//zalo
const configzalo = {
  app_id: "2554",
  key1: "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
  key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
};

export const createZalo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const embed_data = {
    //sau khi hoàn tất thanh toán sẽ đi vào link này (thường là link web thanh toán thành công của mình)
    redirecturl: "/",
  };

  const items: { id: number; name: string; price: number }[] = [];
  const transID = Math.floor(Math.random() * 1000000);

  const order = {
    app_id: configzalo.app_id,
    app_trans_id: `${moment().format("YYMMDD")}_${transID}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
    app_user: "user123",
    app_time: Date.now(), // miliseconds
    item: JSON.stringify(items),
    embed_data: JSON.stringify(embed_data),
    amount: 50000,
    //khi thanh toán xong, zalopay server sẽ POST đến url này để thông báo cho server của mình
    //Chú ý: cần dùng ngrok để public url thì Zalopay Server mới call đến được
    callback_url:
      "https://f396-2402-800-61ae-ad78-ac2c-6cfa-4402-79e0.ngrok-free.app/callback",
    description: `Lazada - Payment for the order #${transID}`,
    bank_code: "",
  };

  // appid|app_trans_id|appuser|amount|apptime|embeddata|item
  const data =
    configzalo.app_id +
    "|" +
    order.app_trans_id +
    "|" +
    order.app_user +
    "|" +
    order.amount +
    "|" +
    order.app_time +
    "|" +
    order.embed_data +
    "|" +
    order.item;
  (order as any).mac = CryptoJS.HmacSHA256(data, configzalo.key1).toString();

  try {
    const result = await axios.post(configzalo.endpoint, null, {
      params: order,
    });

    return res.status(200).json(result.data);
  } catch (error) {
    console.log(error);
  }
};

export const handleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let result = {} as Record<string, unknown>;
  console.log(req.body);
  try {
    let dataStr = req.body.data;
    let reqMac = req.body.mac;

    let mac = CryptoJS.HmacSHA256(dataStr, configzalo.key2).toString();
    console.log("mac =", mac);

    // kiểm tra callback hợp lệ (đến từ ZaloPay server)
    if (reqMac !== mac) {
      // callback không hợp lệ
      result.return_code = -1;
      result.return_message = "mac not equal";
    } else {
      // thanh toán thành công
      // merchant cập nhật trạng thái cho đơn hàng ở đây
      let dataJson = JSON.parse(dataStr);
      console.log(
        "update order's status = success where app_trans_id =",
        dataJson["app_trans_id"]
      );

      result.return_code = 1;
      result.return_message = "success";
    }
  } catch (ex: any) {
    console.log("lỗi:::" + ex.message);
    result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
    result.return_message = ex.message;
  }

  // thông báo kết quả cho ZaloPay server
  res.json(result);
};

export const checkStatus = async (req: Request, res: Response) => {
  let postData = {
    app_id: configzalo.app_id,
    app_trans_id: "<app_trans_id>",
  };

  let data =
    postData.app_id + "|" + postData.app_trans_id + "|" + configzalo.key1; // appid|app_trans_id|key1
  (postData as any).mac = CryptoJS.HmacSHA256(data, configzalo.key1).toString();

  let postConfig = {
    method: "post",
    url: configzalo.endpoint,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
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
    console.log("lỗi");
    console.log(error);
  }
};

export { vnpayCreate, vnpayIpn, vnpayReturn };
