import { configSendMail } from '@/configs/configMail';
import { messagesError, messagesSuccess } from '@/constants/messages';
import { OrderType } from '@/interfaces/Order';
import { sendOrder } from '@/utils/texts';
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';

/**
 *
 * @param dateTime
 * @returns
 */
const formatDateTime = (date: Date): string => {
  return moment(date).format('DD/MM/YYYY HH:mm:ss');
};

/**
 *
 * @param data
 * @param day
 * @param res
 * @param from
 * @param to
 * @returns
 */
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

/**
 *
 * @param email
 * @param data
 * @param amountReduced
 */
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

  const code = null;

  const totalPayment = data.totalPayment != null ? data.totalPayment : 0;
  const formattedTotalPayment =
    typeof totalPayment === 'number'
      ? totalPayment.toLocaleString('vi-VN') + ' VND'
      : '0 VND';

  await configSendMail({
    email: email as string,
    subject: subject,
    text: sendOrder(
      subject,
      data,
      message,
      amountReduced,
      formattedTotalPayment
    ),
  });
};

export { filterOrderDay, formatDateTime, sendOrderMail };
