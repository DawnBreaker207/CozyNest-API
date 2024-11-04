export const timeCounts = Object.freeze({
  mins_5: 5 * 60 * 1000,
  mins_10: 10 * 60 * 1000,
  mins_15: 15 * 60 * 1000,
  hours_1: 60 * 60 * 1000,
  hours_24: 24 * 60 * 60 * 1000,
});

export const statusOrder: readonly string[] = [
  'Processing', //Đang xử lý
  'Pending', //Chờ xác nhận
  'Confirmed', //Đã xác nhận
  'Pending-Ship', //Đang chờ bên vận chuyển
  'Delivering', //Đang vận chuyển
  'Delivered', //Giao hàng thành công
  'Canceled', //Đã hủy đơn hàng
  'Completed', //Đơn hàng hoàn thành
  'Returned', //Hoàn trả đơn hàng
  'Refunded', //Hoàn trả đơn hàng và hoàn tiền
];
export const paymentMethod: readonly string[] = [
  'COD', // Thanh toán khi nhận hàng
  'MoMo', //Thanh toán qua Momo
  'VNPay', //Thanh toán VnPay
  'ZaloPay', //Thanh toán ZaloPay
];
