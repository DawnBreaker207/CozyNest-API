import { Order } from '@/models/Order'; // Import Order model
import logger from '@/utils/logger'; // Import logger nếu có
// Hàm tự động cập nhật trạng thái đơn hàng
const autoCancelDeliveringOrders = async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Tìm các đơn hàng có trạng thái 'Delivering' và được tạo hơn 3 ngày trước
    const orders = await Order.find({
      status: 'Delivering',
      updatedAt: { $lte: threeDaysAgo },
    });

    if (orders.length > 0) {
      const orderIds = orders.map((order) => order._id);

      // Cập nhật trạng thái thành 'Canceled'
      await Order.updateMany(
        { _id: { $in: orderIds } },
        { $set: { status: 'Canceled' } },
      );

      logger.info(
        `Đã tự động cập nhật ${orders.length} đơn hàng sang trạng thái 'Canceled'.`,
      );
    } else {
      logger.info('Không có đơn hàng nào cần tự động hủy.');
    }
  } catch (error) {
    logger.error('Lỗi khi tự động hủy đơn hàng:', error);
  }
};

// Tạo cron job chạy mỗi ngày lúc 0:00
const startCronJob = () => {
  logger.info('Cron job tự động hủy đơn hàng đã được khởi động.');

  // Cron chạy mỗi 24 giờ
  const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

  setInterval(async () => {
    await autoCancelDeliveringOrders();
  }, ONE_DAY_IN_MS);
};

// Khởi chạy cron job
startCronJob();
