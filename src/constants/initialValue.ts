export const timeCounts = Object.freeze({
  mins_5: 5 * 60 * 1000,
  mins_10: 10 * 60 * 1000,
  mins_15: 15 * 60 * 1000,
  hours_1: 60 * 60 * 1000,
  hours_24: 24 * 60 * 60 * 1000,
});

export const statusOrder: readonly string[] = [
  //Đang xử lý
  'Processing',
  //Chờ xác nhận
  'Pending',
  //Đã xác nhận
  'Confirmed',
  //Đang chờ bên vận chuyển
  'Pending-Ship',
  //Đang vận chuyển
  'Delivering',
  //Giao hàng thành công
  'Delivered',
  //Đã hủy đơn hàng
  'Canceled',
  //Đơn hàng hoàn thành
  'Completed',
  //Hoàn trả đơn hàng
  'Returned',
  //Hoàn trả đơn hàng và hoàn tiền
  'Refunded',
];
export const paymentMethod: readonly string[] = [
  // Thanh toán khi nhận hàng
  'COD',
  //Thanh toán qua Momo
  'MoMo',
  //Thanh toán VnPay
  'VNPay',
  //Thanh toán ZaloPay
  'ZaloPay',
];
