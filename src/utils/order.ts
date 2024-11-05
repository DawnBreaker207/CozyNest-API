import { configSendMail } from '@/configs/configMail';
import { messagesError, messagesSuccess } from '@/constants/messages';
import { OrderType } from '@/interfaces/Order';
import { sendOrder } from '@/utils/texts';
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import { timeCounts } from '../constants/initialValue';

/**
 *
 * @param dateTime
 * @returns
 */
const formatDateTime = (date: Date): string =>
    moment(date).format('DD/MM/YYYY HH:mm:ss'),
  /**
   *
   * @param data
   * @param day
   * @param res
   * @param from
   * @param to
   * @returns
   */
  filterOrderDay = async (
    data: any,
    day: number,
    res: Response,
    from?: string,
    to?: string,
  ) => {
    const today = new Date(),
      filterData: OrderType[] = [];

    if (day) {
      const dayOfPast =
        today.getTime() - day * (timeCounts.hours_24 || 24 * 60 * 60 * 1000);
      for (const item of data) {
        const itemDate = new Date(item.createdAt || Date.now());
        if (itemDate.getTime() >= dayOfPast && itemDate <= today) {
          filterData.push(item);
        }
      }
    }
    if (from && to) {
      const fromDate = new Date(from),
        toDate = new Date(to);

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
  },
  /**
   *
   * @param email
   * @param data
   * @param amountReduced
   */
  sendOrderMail = async (
    email?: string,
    data?: any,
    amountReduced?: number,
  ) => {
    let message: string | null = null,
      subject: string | null = null;
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

    // Const code = null;

    const totalPayment = data.totalPayment != null ? data.totalPayment : 0,
      formattedTotalPayment =
        typeof totalPayment === 'number'
          ? `${totalPayment.toLocaleString('vi-VN')} VND`
          : '0 VND';

    await configSendMail({
      email: email as string,
      subject,
      text: sendOrder(
        subject,
        data,
        message,
        amountReduced,
        formattedTotalPayment,
      ),
    });
  };

export { filterOrderDay, formatDateTime, sendOrderMail };
