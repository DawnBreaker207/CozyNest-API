import { StatusCodes } from '@/http-status-codes/build/cjs';
import { EMAIL_PASSWORD, EMAIL_USERNAME } from '@/utils/env';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';
import nodemailer from 'nodemailer';

/**
 *
 * @param input
 */
export const configSendMail = async (input: {
  email: string;
  subject: string;
  text: string;
}) => {
  try {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: EMAIL_USERNAME,
          pass: EMAIL_PASSWORD,
        },
        authMethod: 'PLAIN',
      }),
      mailOptions = {
        from: EMAIL_USERNAME,
        to: input.email,
        subject: input.subject,
        html: input.text,
      };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.log('error', `catch errors in mail config: ${error}`);
    throw new AppError(StatusCodes.BAD_REQUEST, `Error sending mail:${error}`);
  }
};
