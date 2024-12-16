import Notification from '@/models/Notification';
import logger from '@/utils/logger';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

const routeNotification = Router();

routeNotification.get('/', async (req, res, next) => {
  // const { userId } = req.query;
  try {
    const notifications = await Notification.find().sort({
      timestamp: -1,
    });
    res.status(StatusCodes.OK).json({ res: notifications });
  } catch (error) {
    logger.log('error', `Catch in get notifications. Error ${error}`);
    next(error);
  }
});

routeNotification.patch('/:id/read', async (req, res, next) => {
  const { id } = req.params;
  try {
    const notification = await Notification.findById(id);

    if (!notification) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Thông báo không tìm thấy' });
    }

    notification.read = true;
    await notification.save();

    res
      .status(StatusCodes.OK)
      .json({ message: 'Đánh dấu thông báo đã đọc thành công' });
  } catch (error) {
    logger.log('error', `Catch in update notifications. Error ${error}`);
    next(error);
  }
});
export default routeNotification;
