import { Request, Response, NextFunction } from "express";
import moment from "moment";
import querystring from "qs";
import crypto from "crypto";

// Hàm tạo yêu cầu thanh toán VNPay
export const vnpayCreate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Thiết lập múi giờ
    process.env.TZ = "Asia/Ho_Chi_Minh";

    // Lấy thời gian hiện tại và định dạng
    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    const orderId = moment(date).format("DDHHmmss");

    // Lấy địa chỉ IP của khách hàng
    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.remoteAddress;

    // Cấu hình VNPay từ file config
    const tmnCode: string = "X5NX5EN5";
    const secretKey: string = "RNRIQQQUPZTWBTBBTAXZEHQFRYMKOVII";
    let vnpUrl: string = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const returnUrl: string =
      "http://localhost:3000/api/v1/payment/vnpay-return";

    // Thông tin đơn hàng từ body của request
    const amount: number = req.body.amount;
    const bankCode: string = req.body.bankCode || "";
    let locale: string = req.body.language || "vn";
    const currCode = "VND";

    // Khởi tạo tham số VNPay
    const vnp_Params: Record<string, string | number> = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan cho ma GD: ${orderId}`,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100, // Số tiền (đơn vị nhỏ nhất)
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: String(ipAddr) || "127.0.0.1", // default to localhost if ipAddr is undefined
      vnp_CreateDate: createDate,
    };

    // Thêm mã ngân hàng nếu có
    if (bankCode) {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    // Sắp xếp các tham số
    const sortedParams = sortObject(vnp_Params);

    // Tạo chữ ký bảo mật
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    sortedParams["vnp_SecureHash"] = signed;

    // Tạo URL thanh toán
    const paymentUrl = `${vnpUrl}?${querystring.stringify(sortedParams, {
      encode: false,
    })}`;

    // Chuyển hướng người dùng đến VNPay
    res.redirect(paymentUrl);
  } catch (error) {
    // Xử lý lỗi
    console.error("Lỗi khi tạo yêu cầu VNPay:", error);
    next(error); // Chuyển lỗi sang middleware tiếp theo
  }
};

// Hàm sắp xếp đối tượng theo thứ tự alphabet
const sortObject = (obj: Record<string, any>): Record<string, any> => {
  return Object.keys(obj)
    .sort() // Sắp xếp các khóa theo thứ tự alphabet
    .reduce((sortedObj: Record<string, any>, key) => {
      sortedObj[key] = obj[key]; // Thêm cặp key-value đã sắp xếp vào đối tượng mới
      return sortedObj;
    }, {});
};

export const vnpayIpn = async (req: any, res: any, next: any) => {};
export const vnpayReturn = async (req: any, res: any, next: any) => {};
