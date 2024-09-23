import { RequestHandler } from 'express';
import { sendMail } from '../configs/configMail';
import { StatusCodes } from 'http-status-codes';
import { messagesSuccess } from '../constants/messages';

const sendMailRequest: RequestHandler = async (req, res, next) => {
  try {
    const emailOption = {
      email: req.body.email,
      subject: req.body.subject,
      text: `
            <div style="margin-bottom: 10px;">
            <img src="https://spacingtech.com/html/tm/freozy/freezy-ltr/image/logo/logo.png" style="width: 200px; height: auto; margin-right: 10px;" />
             <p>${req.body.content}</p>             
            </div>
          `,
    };
    await sendMail(emailOption);
    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.SEND_EMAIL_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

export { sendMailRequest };
