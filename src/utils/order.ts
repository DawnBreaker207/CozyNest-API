import { sendMail } from '@/configs/configMail';
import { messagesError, messagesSuccess } from '@/constants/messages';
import { OrderType } from '@/interfaces/Order';
import { sendOrder } from '@/utils/texts';
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const formatDateTime = (dateTime: Date) => {
  const date = new Date(dateTime);
  const formattedDate = `${date.getDay()}/${
    date.getMonth() + 1
  }/${date.getFullYear()}`;
  const formattedTime = `${date.getHours()}:${date.getMinutes()}:${
    date.getSeconds
  }`;
  return `${formattedDate} ${formattedTime}`;
};

const filterOrderDay = async (
  data: any,
  day: number,
  res: Response,
  from?: string,
  to?: string
) => {
  const today = new Date();
  const filterData: OrderType[] = [];

  if (day) {
    const dayOfPast = today.getTime() - day * (24 * 60 * 60 * 1000);
    for (const item of data) {
      const itemDate = new Date(item.createdAt || Date.now());
      if (itemDate.getTime() >= dayOfPast && itemDate <= today) {
        filterData.push(item);
      }
    }
  }
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    toDate.setHours(23, 59, 59, 999);
    for (const item of data) {
      const itemDate = new Date(item.createdAt || Date.now());
      if (itemDate >= fromDate && itemDate <= toDate) {
        filterData.push(item);
      }
    }
  }

  if (filterData.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: messagesError.NOT_FOUND,
      res: [],
    });
  }

  res.status(StatusCodes.OK).json({
    message: messagesSuccess.GET_ORDER_SUCCESS,
    res: {
      data: filterData,
      pagination: {
        currentPage: data.page,
        totalPages: data.totalPages,
        totalItems: data.totalDocs,
      },
    },
  });
};

const sendOrderMail = async (
  email?: string,
  data?: any,
  amountReduced?: number
) => {
  let subject: string | null = null;
  let message: string | null = null;
  if (data.status === messagesSuccess.PENDING) {
    subject = messagesSuccess.ORDER_CREATE_SUBJECT;
    message = messagesSuccess.ORDER_CREATE_MESSAGE;
  } else if (data.status === messagesSuccess.ORDER_DONE) {
    subject = messagesSuccess.ORDER_UPDATE_SUBJECT;
    message = messagesSuccess.ORDER_UPDATE_MESSAGE;
  } else {
    subject = messagesSuccess.ORDER_UPDATE_SUBJECT;
    message = messagesSuccess.ORDER_UPDATE_MESSAGE;
  }

  let code = null;
  await sendMail({
    email: email as string,
    subject: subject,
    text: sendOrder(data, message, amountReduced, code),
  });
  // await sendMail({
  //   email: email as string,
  //   subject: subject,
  //   text: /*html*/ `<div>
  //                 <a target="_blank" href="http:localhost:5173">
  //                   <img src="https://spacingtech.com/html/tm/freozy/freezy-ltr/image/logo/logo.png" style="width:80px;color:#000"/>
  //                 </a>
  //                 <p style="color:#2986cc;">Kính gửi Anh/chị: ${
  //                   data.customerName
  //                 } </p>
  //                 <p>${message} </p>
  //                 <p style="font-weight:bold">Hóa đơn được tạo lúc: ${formatDateTime(
  //                   data.createdAt
  //                 )}</p>
  //                 <div style="border:1px solid #ccc;border-radius:10px; padding:10px 20px;width: max-content">
  //                 <p>Mã hóa đơn: ${data.invoiceId}</p>
  //                 <p>Khách hàng: ${data.customerName}</p>
  //                 <p>Điện thoại: ${data.phoneNumber}</p>
  //                 <p>Địa chỉ nhận hàng: ${data.shippingAddress}</p>
  //                 <table style="text-align:center">
  //                 <thead>
  //                   <tr style="background-color: #CFE2F3;">
  //                     <th style="padding: 10px;">STT</th>
  //                     <th style="padding: 10px;">Sản phẩm</th>
  //                     <th style="padding: 10px;">Cân nặng</th>
  //                     <th style="padding: 10px;">Đơn giá</th>
  //                   </tr>
  //                 </thead>
  //                 <tbody>
  //                   ${data.products
  //                     .map(
  //                       (product: ProductType, index: number) =>
  //                         `
  //         <tr style="border-bottom:1px solid #ccc">
  //           <td style="padding: 10px;">${index + 1}</td>
  //           <td style="padding: 10px;"><img alt="image" src="${
  //             product.thumbnail
  //           }" style="width: 90px; height: 90px;border-radius:5px">
  //           <p>${product.name} (${product.name})</p>
  //           </td>

  //           <td style="padding: 10px;">${product.base_price.toLocaleString(
  //             'vi-VN'
  //           )}VNĐ/kg</td>
  //         </tr>
  //      `
  //                     )
  //                     .join('')}
  //                 </tbody>
  //               </table>
  //               <h4>Tổng: ${
  //                 amountReduced != null
  //                   ? (amountReduced + data.totalPayment).toLocaleString(
  //                       'vi-VN'
  //                     ) + 'VND'
  //                   : `${data.totalPayment.toLocaleString('vi-VN')}VND`
  //               }</h4> ${code != null ? `<p>${code}</p>` : ''}
  //                 <h3 style="color: red;font-weight:bold;margin-top:20px">Tổng tiền thanh toán: ${data.totalPayment.toLocaleString(
  //                   'vi-VN'
  //                 )}VNĐ</h3>
  //                 <p>Thanh toán: ${
  //                   data.pay == false
  //                     ? 'Thanh toán khi nhận hàng'
  //                     : 'Đã thanh toán online'
  //                 }</p>
  //                 <p>Trạng thái đơn hàng: ${data.status}</p>
  //                 </div>
  //                  <p>Xin cảm ơn quý khách!</p>
  //                  <p style="color:#2986CC;font-weight:500;">Bộ phận chăm sóc khách hàng FRESH MART: <a href="tel:0565079665">0565 079 665</a></p>
  //               </div>`,
  // });
};

export { filterOrderDay, formatDateTime, sendOrderMail };
