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
