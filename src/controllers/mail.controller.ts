import { configSendMail } from '@/configs/configMail';
import { messagesSuccess } from '@/constants/messages';
import { sendExportMail } from '@/utils/texts';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import pug from 'pug';

const sendMailRequest: RequestHandler = async (req, res, next) => {
  try {
    const { email, orderId, orderDate, customerName, customerPhone, customerAddress, products, totalAmount, paymentMethod, paymentStatus } = req.body;

    // Render email từ template pug với dữ liệu đơn hàng
    const emailContent = pug.renderFile('path/to/invoiceTemplate.pug', {
      customerName,
      orderDate,
      orderId,
      customerPhone,
      customerAddress,
      products,
      totalAmount,
      paymentMethod,
      paymentStatus,
    });

    // Thiết lập thông tin email
    const emailOption = {
      email: email as string,  // Ensure email is a string
      subject: `Hóa đơn cho đơn hàng ${orderId}`,
      text: emailContent,  // Rename html to text
    };

    // Gửi email
    await configSendMail(emailOption);

    // Phản hồi thành công
    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.SEND_EMAIL_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};


export { sendMailRequest };
