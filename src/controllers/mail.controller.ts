import { configSendMail } from '@/configs/configMail';
import { messagesSuccess } from '@/constants/messages';
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
    await configSendMail({
      email: email,
      subject: email,
      text: sendExportMail(subject, content),
    });
    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.SEND_EMAIL_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

export { sendMailRequest };
