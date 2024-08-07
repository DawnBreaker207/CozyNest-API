import nodemailer from 'nodemailer';
import { EMAIL_PASSWORD, EMAIL_USERNAME } from './env';
export const sendMail = async (
  email: string,
  subject: string,
  text: string
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USERNAME,
        pass: EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: EMAIL_USERNAME,
      to: email,
      subject: subject,
      text: text,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error('Error sending mail:' + error);
  }
};
