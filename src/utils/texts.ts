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
    shipping_fee,
  } = data._doc || {};

  // Trích xuất sản phẩm từ `order_details`
  const products = order_details?.products || [];
  const voucher = order_details?.total || 0;
  const totalAmount = order_details?.total_amount || 0;
  const totalProduct = products.reduce((total: number, product: any) => {
    const { price, quantity } = product._doc || {};
    return total + price * quantity; // Nhân giá với số lượng và cộng dồn
  }, 0);
  const shippingFee = shipping_fee || 50000;
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
    shippingFee: shippingFee.toLocaleString('vi-VN') + ' VND',
    voucher: voucher.toLocaleString('vi-VN') + ' VND',
    totalProduct: totalProduct.toLocaleString('vi-VN') + ' VND',
    totalAmount: totalAmount.toLocaleString('vi-VN') + ' VND', // Format tổng tiền
    paymentMethod: (payment_method[0]?.method || 'N/A').toUpperCase(),
    installationFee:
      order_details?.installation_fee.toLocaleString('vi-VN') + ' VND' || 0,
    paymentStatus: payment_status || 'Pending',
  });

  return html;
};
export const sendRefund = (data: any): string => {
  const { customer_name, order_id, createdAt } = data._doc || {};
  const { total_amount } = data;

  const templatePath = path.resolve(__dirname, '../views/sendRefund.pug');

  const html = pug.renderFile(templatePath, {
    order_id: order_id,
    customer_name: customer_name,
    refund_amount: total_amount.toLocaleString('vi-VN') + ' VND',
    daySolve: formatDateTime(createdAt),
  });

  return html;
};
