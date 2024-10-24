import { EMAIL_PASSWORD, EMAIL_USERNAME } from '@/utils/env';
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
    });

    const mailOptions = {
      from: EMAIL_USERNAME,
      to: input.email,
      subject: input.subject,
      html: input.text,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error('Error sending mail:' + error);
  }
};
