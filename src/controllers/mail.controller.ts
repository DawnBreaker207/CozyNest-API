import { configSendMail } from '@/configs/configMail';
import { messagesSuccess } from '@/constants/messages';
import logger from '@/utils/logger';
import { sendExportMail } from '@/utils/texts';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

export const sendMailRequest: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.email Param email input
   * @param {string} req.body.subject Param subject input
   * @param {string} req.body.content Param content input
   */
  const { email, subject, content } = req.body;
  try {
    // TODO: Fix this shit code later, move it into a service in controller update order
    // Const { email, orderId, orderDate, customerName, customerPhone, customerAddress, products, totalAmount, paymentMethod, paymentStatus } = req.body;

    // // Render email từ template pug với dữ liệu đơn hàng
    // Const emailContent = pug.renderFile('path/to/invoiceTemplate.pug', {
    //   CustomerName,
    //   OrderDate,
    //   OrderId,
    //   CustomerPhone,
    //   CustomerAddress,
    //   Products,
    //   TotalAmount,
    //   PaymentMethod,
    //   PaymentStatus,
    // });

    // // Thiết lập thông tin email
    // Const emailOption = {
    //   Email: email as string,  // Ensure email is a string
    //   Subject: `Hóa đơn cho đơn hàng ${orderId}`,
    //   Text: emailContent,  // Rename html to text
    // };

    // // Gửi email
    // Await configSendMail(emailOption);

    // // Phản hồi thành công

    await configSendMail({
      email,
      subject: email,
      text: sendExportMail(subject, content),
    });

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.SEND_EMAIL_SUCCESS,
    });
  } catch (error) {
    logger.log('error', `Catch error in send mail request: ${error}`);
    next(error);
  }
};
