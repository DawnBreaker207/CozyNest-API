import { statusOrder } from '@/constants/initialValue';
import { messagesError, messagesSuccess } from '@/constants/messages';
import Order from '@/models/Order';
import { filterOrderDay, sendOrderMail } from '@/utils/order';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

//! Client
const CreateOrder: RequestHandler = async (req, res, next) => {
  const body = req.body;
  try {
    const order = await Order.create(body);
    if (!order) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.BAD_REQUEST });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CREATE_ORDER_SUCCESS,
      res: order,
    });
  } catch (error) {
    next(error);
  }
};

const RemoveOrder: RequestHandler = async (req, res, next) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res
      .status(StatusCodes.NO_CONTENT)
      .json({ message: messagesSuccess.REMOVE_ORDER_SUCCESS });
  } catch (error) {
    next(error);
  }
};

//! For admin
const GetAllOrders: RequestHandler = async (req, res, next) => {
  const {
    _page = 1,
    _order = 'asc',
    _limit = 9999,
    _sort = 'createAt',
    _status = '',
    _day,
    _invoiceId = '',
  } = req.query;
  const page = typeof _page === 'string' ? parseInt(_page, 10) : 1;
  const limit = typeof _limit === 'string' ? parseInt(_limit, 10) : 9999;

  const sortField = typeof _sort === 'string' ? _sort : 'createAt';

  let day: number | undefined;

  if (_day) {
    // Kiểm tra xem _day có phải là chuỗi không
    if (typeof _day === 'string') {
      day = parseInt(_day, 10); // Chuyển đổi chuỗi thành số
    }
    // Kiểm tra xem _day có phải là mảng không
    else if (Array.isArray(_day) && _day.length > 0) {
      // Kiểm tra phần tử đầu tiên có phải là chuỗi không
      if (typeof _day[0] === 'string') {
        day = parseInt(_day[0], 10); // Lấy phần tử đầu tiên của mảng và chuyển đổi thành số
      }
    }
  }

  const options = {
    page: page,
    limit: limit,
    sort: { [sortField]: _order === 'desc' ? -1 : 1 },
  };

  try {
    const query: any = {};

    if (_status) {
      query.status = _status;
    }
    const data = await Order.paginate(query, options);
    if (_invoiceId) {
      const data = await Order.find({ invoiceId: _invoiceId });
      if (!data) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: messagesError.NOT_FOUND, res: [] });
      }
      return res.status(StatusCodes.CREATED).json({
        message: messagesSuccess.GET_ORDER_SUCCESS,
        res: data,
      });
    }

    if (day) {
      filterOrderDay(data.docs, day, res);
      return;
    }

    if (data.docs.length === 0) {
      return res.status(StatusCodes.OK).json({
        message: messagesSuccess.GET_ORDER_SUCCESS,
        res: [],
      });
    }

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_ORDER_SUCCESS,
      res: {
        data: data.docs,
        pagination: {
          currentPage: data.page,
          totalPages: data.totalPages,
          totalItems: data.totalDocs,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const GetOrder: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id).exec();

    if (!order) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.BAD_REQUEST });
    }

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_ORDER_SUCCESS,
      res: order,
    });
  } catch (error) {
    next(error);
  }
};

const UpdateOrder: RequestHandler = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
        res: [],
      });
    }

    let data = null;

    if (status == messagesError.ORDER_FAILED) {
      if (currentOrder.status != '' && currentOrder.status != '') {
        data = await Order.findByIdAndUpdate(
          orderId,
          {
            ...req.body,
            userId: new mongoose.Types.ObjectId(req.body.userId),
          },
          {
            new: true,
          }
        );
      } else {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: messagesError.FORBIDDEN,
        });
      }
    }
    if (!statusOrder.includes(status) && status != messagesError.ORDER_FAILED) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    data = await Order.findByIdAndUpdate(
      orderId,
      {
        ...req.body,
        userId: new mongoose.Types.ObjectId(req.body.userId),
      },
      { new: true }
    );

    sendOrderMail(data?.email, data);

    return res.status(200).json({
      res: data,
    });
  } catch (error) {
    next(error);
  }
};

export { CreateOrder, GetAllOrders, GetOrder, RemoveOrder, UpdateOrder };
