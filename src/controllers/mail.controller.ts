import { configSendMail } from '@/configs/configMail';
import { messagesSuccess } from '@/constants/messages';
import logger from '@/utils/logger';
import { sendExportMail } from '@/utils/texts';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const sendMailRequest: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.email Param email input
   * @param {string} req.body.subject Param subject input
   * @param {string} req.body.content Param content input
   */
  const { email, subject, content } = req.body;
  try {

    // TODO: Fix this shit code later, move it into a service in controller update order
    // const { email, orderId, orderDate, customerName, customerPhone, customerAddress, products, totalAmount, paymentMethod, paymentStatus } = req.body;

    // // Render email từ template pug với dữ liệu đơn hàng
    // const emailContent = pug.renderFile('path/to/invoiceTemplate.pug', {
    //   customerName,
    //   orderDate,
    //   orderId,
    //   customerPhone,
    //   customerAddress,
    //   products,
    //   totalAmount,
    //   paymentMethod,
    //   paymentStatus,
    // });

    // // Thiết lập thông tin email
    // const emailOption = {
    //   email: email as string,  // Ensure email is a string
    //   subject: `Hóa đơn cho đơn hàng ${orderId}`,
    //   text: emailContent,  // Rename html to text
    // };

    // // Gửi email
    // await configSendMail(emailOption);

    // // Phản hồi thành công

    await configSendMail({
      email: email,
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


export { sendMailRequest };
