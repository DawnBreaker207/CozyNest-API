import { ProductType } from '@/interfaces/Product';
import { formatDateTime } from '@/utils/order';

const sendExportMail = (content: string): string => {
  return /*html*/ ` 
            <div style="margin-bottom: 10px;">
            <img 
                  src="https://res.cloudinary.com/devr9hihw/image/upload/v1727368649/azvhqocb9cqex72p7rgb.png" 
                  style="width: 200px; height: auto; margin-right: 10px;"
            />
            <p>${content}</p>             
            </div>`;
};
const sendVerifyMail = (content: string): string => {
  return /*html*/ `
           <div style="margin-bottom: 10px;">
           <img 
                style="width: 80px; height: auto; margin-right: 10px;" 
                src="https://res.cloudinary.com/devr9hihw/image/upload/v1727368649/azvhqocb9cqex72p7rgb.png" 
            />
           <p>Mã xác nhận của bạn là: 
              <strong style="color:#f12; background-color:#bedaef; font-size:20px; border-radius:5px; padding:10px;">
                ${content}
              </strong>.
              <br/> 
                Mã này sẽ hết hiệu lực sau 5 phút. Vui lòng không để lộ mã xác nhận để bảo vệ tài khoản của bạn!
            </p>
         </div>
               `;
};
const sendResetMail = (content: string): string => {
  return /*html*/ `
                <div>
                  <h1>Your new password is ${content}</h1>
                <div>
                  `;
};
const sendOrder = (
  data: any,
  message: string,
  amountReduced?: number,
  code?: null
): string => {
  return /*html*/ `
  <div>
        <a target="_blank" href="http:localhost:5173">
          <img src="https://res.cloudinary.com/devr9hihw/image/upload/v1727368649/azvhqocb9cqex72p7rgb.png" style="width:80px;color:#000"/>
        </a>
          <p style="color:#2986cc;">Kính gửi Anh/chị: ${data.customerName}</p> 
          <p>${message}</p>
          <p style="font-weight:bold">Hóa đơn được tạo lúc: ${formatDateTime(
            data.createdAt
          )}</p>
          <div style="border:1px solid #ccc;border-radius:10px; padding:10px 20px;width: max-content">
            <p>Mã hóa đơn: ${data.invoiceId}</p>
            <p>Khách hàng: ${data.customerName}</p>
            <p>Điện thoại: ${data.phoneNumber}</p>
            <p>Địa chỉ nhận hàng: ${data.shippingAddress}</p>
          <table style="text-align:center">
            <thead>
              <tr style="background-color: #CFE2F3;">
                <th style="padding: 10px;">STT</th>
                <th style="padding: 10px;">Sản phẩm</th>
                <th style="padding: 10px;">Cân nặng</th>
                <th style="padding: 10px;">Đơn giá</th>
              </tr>
            </thead>
            <tbody>
                    ${data.products
                      .map(
                        (product: ProductType, index: number) => /*html*/ `
              <tr style="border-bottom:1px solid #ccc">
                <td style="padding: 10px;">${index + 1}</td>
                <td style="padding: 10px;">
                      <img alt="image" src="${
                        product.thumbnail
                      }" style="width: 90px; height: 90px;border-radius:5px">
                      <p>${product.name} (${product.name})</p>
                </td>
                <td style="padding: 10px;">${product.base_price.toLocaleString(
                  'vi-VN'
                )}VNĐ/kg</td>
              </tr>
                        `
                      )
                      .join('')}
            </tbody>
          </table>  
            <h4>Tổng: ${
              amountReduced != null
                ? (amountReduced + data.totalPayment).toLocaleString('vi-VN') +
                  'VND'
                : `${data.totalPayment.toLocaleString('vi-VN')} VND`
            }
            </h4> 
            ${code != null ? `<p>${code}</p>` : ''}
            <h3 style="color: red;font-weight:bold;margin-top:20px">Tổng tiền thanh toán: 
            ${data.totalPayment.toLocaleString('vi-VN')}VNĐ</h3>
            <p>Thanh toán: ${
              data.pay == false
                ? 'Thanh toán khi nhận hàng'
                : 'Đã thanh toán online'
            }
            </p>
            <p>Trạng thái đơn hàng: ${data.status}</p>
            </div>
            <p>Xin cảm ơn quý khách!</p>
            <p style="color:#2986CC;font-weight:500;">Bộ phận chăm sóc khách hàng FRESH MART: <a href="tel:0565079665">0565 079 665</a></p>
  </div>`;
};

export { sendExportMail, sendOrder, sendResetMail, sendVerifyMail };
