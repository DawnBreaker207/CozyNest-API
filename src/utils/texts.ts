import path from 'path';
import pug from 'pug';
import { formatDateTime } from '../services/order.service';

/**
 *
 * @param subject
 * @param content
 * @returns
 */
export const sendExportMail = (subject?: string, content?: string): string => {
  const templatePath = path.resolve(__dirname, '../views/exportMail.pug'),
    html = pug.renderFile(templatePath, { subject, content });

  return html;
};
/**
 *
 * @param subject
 * @param content
 * @returns
 */
export const sendVerifyMail = (subject?: string, content?: string): string => {
  const templatePath = path.resolve(__dirname, '../views/verifyEmail.pug'),
    html = pug.renderFile(templatePath, { subject, content });

  return html;
};
/**
 *
 * @param subject
 * @param content
 * @returns
 */
export const sendResetMail = (subject?: string, content?: string): string => {
  const templatePath = path.resolve(__dirname, '../views/forgetPassword.pug'),
    html = pug.renderFile(templatePath, { content });

  return html;
};
/**
 *
 * @param subject
 * @param data
 * @param message
 * @param amountReduced
 * @param formattedTotalPayment
 * @returns
 */
export const sendOrder = (data: any): string => {
  const {
    customer_name,
    phone_number,
    address,
    payment_status,
    payment_method = [],
    createdAt,
    _id,
    order_details,
  } = data._doc || {};

  // Trích xuất sản phẩm từ `order_details`
  const products = order_details?.products || [];
  const totalAmount = order_details?.total || 0;
  const templatePath = path.resolve(__dirname, '../views/sendOrder.pug');
  const html = pug.renderFile(templatePath, {
    customerName: customer_name,
    orderDate: formatDateTime(createdAt),
    orderId: _id?.toString(),
    customerPhone: phone_number,
    customerAddress: address,
    products: products.map((product: any, index: number) => {
      const { sku_id, price, quantity } = product._doc; // Trích xuất từ `_doc`
      return {
        ...product,
        name: sku_id?.name || 'Sản phẩm chưa rõ',
        index: index + 1,
        image: sku_id?.image?.[0] || 'https://via.placeholder.com/80',
        price: price.toLocaleString('vi-VN') + ' VND', // Định dạng giá
        quantity: quantity,
      };
    }),
    totalAmount: totalAmount.toLocaleString('vi-VN') + ' VND', // Format tổng tiền
    paymentMethod: (payment_method[0]?.method || 'N/A').toUpperCase(),
    paymentStatus: payment_status || 'Pending',
  });

  return html;
};
