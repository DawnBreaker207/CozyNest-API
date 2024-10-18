import path from 'path';
import pug from 'pug';
import { formatDateTime } from './order';
/**
 *
 * @param content
 * @returns
 */
const sendExportMail = (subject: string, content: string): string => {
  const templatePath = path.resolve(__dirname, '../views/exportMail.pug');

  const html = pug.renderFile(templatePath, { subject, content });

  return html;
};

/**
 *
 * @param content
 * @returns
 */
const sendVerifyMail = (subject: string, content: string): string => {
  const templatePath = path.resolve(__dirname, '../views/verifyEmail.pug');

  const html = pug.renderFile(templatePath, { subject, content });

  return html;
};

/**
 *
 * @param content
 * @returns
 */
const sendResetMail = (subject: string, content: string): string => {
  const templatePath = path.resolve(__dirname, 'views/forgetPassword.pug');

  const html = pug.renderFile(templatePath, { content });

  return html;
};

/**
 *
 * @param data
 * @param message
 * @param amountReduced
 * @param formattedTotalPayment
 * @returns
 */
const sendOrder = (
  subject: string,
  data: any,
  message: string,
  amountReduced?: number,
  formattedTotalPayment?: string
): string => {
  const totalPayment =
    typeof data.totalPayment === 'number' ? data.totalPayment : 0;
  const formattedTotalPaymentValue =
    totalPayment.toLocaleString('vi-VN') + ' VNĐ';

  const templatePath = path.resolve(__dirname, '../views/sendOrder.pug');

  const html = pug.renderFile(templatePath, {
    subject,
    data,
    message,
    amountReduced,
    formattedTotalPayment,
    totalPayment,
    formattedTotalPaymentValue,
    formatDateTime,
  });

  return html;
};

export { sendExportMail, sendOrder, sendResetMail, sendVerifyMail };
