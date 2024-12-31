import { Order } from '@/models/Order';
import logger from './logger';
import { timeCounts } from '@/constants/initialValue';

// Hàm tự động cập nhật trạng thái đơn hàng
const autoCancelDeliveringOrders = async () => {
  try {
    // Cập nhật trạng thái đơn hàng 'Delivering' nếu quá 3 ngày chưa cập nhật
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Tìm các đơn hàng có trạng thái 'Delivering' và được tạo hơn 3 ngày trước
    const deliveringOrders = await Order.find({
      status: 'Delivering',
      updatedAt: { $lte: threeDaysAgo },
    });

    if (deliveringOrders.length > 0) {
      const deliveringOrderIds = deliveringOrders.map((order) => order._id);

      // Cập nhật trạng thái thành 'Cancelled'
      await Order.updateMany(
        { _id: { $in: deliveringOrderIds } },
        { $set: { status: 'Cancelled' } },
      );

      logger.info(
        `Đã tự động cập nhật ${deliveringOrders.length} đơn hàng sang trạng thái 'Cancelled'.`,
      );
    } else {
      logger.info('Không có đơn hàng nào cần tự động hủy.');
    }

    // Cập nhật trạng thái cho các đơn hàng đã giao mà chưa được xác nhận
    const deliveredOrdersWithoutConfirm = await Order.find({
      status: 'Delivered',
      updatedAt: { $lte: threeDaysAgo }, // Điều kiện đơn hàng đã giao
    });

    if (deliveredOrdersWithoutConfirm.length > 0) {
      const deliveredOrderIds = deliveredOrdersWithoutConfirm.map(
        (order) => order._id,
      );

      // Cập nhật trạng thái thành 'Completed'
      await Order.updateMany(
        { _id: { $in: deliveredOrderIds } },
        { $set: { status: 'Completed' } },
      );

      logger.info(
        `Đã tự động cập nhật ${deliveredOrdersWithoutConfirm.length} đơn hàng sang trạng thái 'Completed'.`,
      );
    } else {
      logger.info('Không có đơn hàng nào cần tự động hoàn tất.');
    }
  } catch (error) {
    logger.error('Lỗi khi tự động cập nhật trạng thái đơn hàng:', error);
  }
};
// Tạo cron job chạy mỗi ngày lúc 0:00
const startCronJob = () => {
  logger.info(
    'Cron job tự động hủy và cập nhật trạng thái đơn hàng đã được khởi động.',
  );

  // Cron chạy mỗi 24 giờ
  const ONE_DAY_IN_MS = timeCounts.mins_1 || 24 * 60 * 60 * 1000;

  setInterval(async () => {
    await autoCancelDeliveringOrders();
  }, ONE_DAY_IN_MS);
};

// Khởi chạy cron job
startCronJob();
