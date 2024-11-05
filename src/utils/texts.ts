import path from 'path';
import pug from 'pug';
import { formatDateTime } from './order';
/**
 *
 * @param subject
 * @param content
 * @returns
 */
const sendExportMail = (subject: string, content: string): string => {
    const templatePath = path.resolve(__dirname, '../views/exportMail.pug'),
      html = pug.renderFile(templatePath, { subject, content });

    return html;
  },
  /**
   *
   * @param subject
   * @param content
   * @returns
   */
  sendVerifyMail = (subject: string, content: string): string => {
    const templatePath = path.resolve(__dirname, '../views/verifyEmail.pug'),
      html = pug.renderFile(templatePath, { subject, content });

    return html;
  },
  /**
   *
   * @param subject
   * @param content
   * @returns
   */
  sendResetMail = (subject: string, content: string): string => {
    const templatePath = path.resolve(__dirname, '../views/forgetPassword.pug'),
      html = pug.renderFile(templatePath, { content });

    return html;
  },
  /**
   *
   * @param subject
   * @param data
   * @param message
   * @param amountReduced
   * @param formattedTotalPayment
   * @returns
   */
  sendOrder = (
    subject: string,
    data: any,
    message: string,
    amountReduced?: number,
    formattedTotalPayment?: string,
  ): string => {
    const totalPayment =
        typeof data.totalPayment === 'number' ? data.totalPayment : 0,
      formattedTotalPaymentValue = `${totalPayment.toLocaleString('vi-VN')} VNĐ`,
      templatePath = path.resolve(__dirname, '../views/sendOrder.pug'),
      html = pug.renderFile(templatePath, {
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
