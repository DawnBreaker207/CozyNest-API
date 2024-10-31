import { configSendMail } from '@/configs/configMail';
import { messagesSuccess } from '@/constants/messages';
import logger from '@/utils/logger';
import { sendExportMail } from '@/utils/texts';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const sendMailRequest: RequestHandler = async (req, res, next) => {
  try {
    await configSendMail({
      email: req.body.email,
      subject: req.body.subject,
      text: sendExportMail(req.body.subject, req.body.content),
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
