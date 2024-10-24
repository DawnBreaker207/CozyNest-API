import { configSendMail } from '@/configs/configMail';
import { messagesSuccess } from '@/constants/messages';
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
    next(error);
  }
};

export { sendMailRequest };
