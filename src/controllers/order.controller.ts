import { statusOrder } from '@/constants/initialValue';
import { messagesError, messagesSuccess } from '@/constants/messages';
import Order from '@/models/Order';
import { filterOrderDay, sendOrderMail } from '@/utils/order';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

//! Client
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
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

/**
 *
 * @param req
 * @param res
 * @param next
 */
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
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
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

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
const GetOneOrder: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(StatusCodes.NOT_FOUND).json;
    }
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

const GetOrderByUserId: RequestHandler = async (req, res, next) => {
  try {
    const {
      _page = 1,
      _sort = 'created_at',
      _order = 'desc',
      _limit = 10,
      status,
      userId,
    } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId as string)) {
      query.userId = new mongoose.Types.ObjectId(userId as string);
    }
    const page = typeof _page === 'string' ? parseInt(_page, 10) : 1;
    const limit = typeof _limit === 'string' ? parseInt(_limit, 10) : 9999;
    const sortField = typeof _sort === 'string' ? _sort : 'createAt';
    const options = {
      page: page,
      limit: limit,
      sort: {
        [sortField]: _order === 'desc' ? -1 : 1,
      },
      select: ['-deleted', '-deleted_at'],
    };
    const { docs, ...paginate } = await Order.paginate(query, options);
    if (!docs || docs.length === 0) {
      return res.status(StatusCodes.NO_CONTENT).json({
        message: messagesSuccess.NO_CONTENT,
      });
    }

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_ORDER_SUCCESS,
      res: {
        orders: docs,
        paginate,
      },
    });
  } catch (error) {
    next(error);
  }
};
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
const UpdateOrder: RequestHandler = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const {
      status,
      userId,
      customerName,
      phoneNumber,
      email,
      addressShipping,
    } = req.body;

    if (!status) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }

    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
        res: [],
      });
    }

    if (
      status === messagesError.ORDER_FAILED &&
      (currentOrder.status === 'Completed' ||
        currentOrder.status === 'Delivered')
    ) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: messagesError.FORBIDDEN,
      });
    }

    if (
      !statusOrder.includes(status) &&
      status !== messagesError.ORDER_FAILED
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }

    const updateData = await Order.findByIdAndUpdate(
      orderId,
      {
        ...req.body,
        userId: userId ? new mongoose.Types.ObjectId(userId) : null,
        customerName: customerName || currentOrder.customerName,
        phoneNumber: phoneNumber || currentOrder.phoneNumber,
        email: email || currentOrder.email,
        addressShipping: addressShipping || currentOrder.addressShipping,
      },
      { new: true }
    );

    if (status === messagesError.ORDER_CANCELED) {
    }
    if (updateData?.email) {
      try {
        await sendOrderMail(updateData?.email, updateData);
      } catch (error) {
        next(error);
      }
    }

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_ORDER_SUCCESS,
      res: updateData,
    });
  } catch (error) {
    next(error);
  }
};

const CancelOrder: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    const ordered = await Order.findById(id);
    // Cancel
    if (ordered?.status === 'Canceled') {
      return res.status(StatusCodes.ACCEPTED).json({
        message: messagesSuccess.ORDER_SUCCESS_MESSAGE,
      });
    }
    if (ordered?.status === 'Delivering') {
      return res.status(StatusCodes.ACCEPTED).json({
        message: messagesSuccess.ORDER_SUCCESS_MESSAGE,
      });
    }
    if (ordered?.status === 'Return') {
      return res.status(StatusCodes.ACCEPTED).json({
        message: messagesSuccess.ORDER_SUCCESS_MESSAGE,
      });
    }
    if (!ordered) {
      return res.status(StatusCodes.ACCEPTED).json({
        message: messagesSuccess.ORDER_SUCCESS_MESSAGE,
      });
    }
    const order = await Order.findByIdAndUpdate(
      id,
      {
        $set: { status: 'cancelled' },
        $push: {
          status: 'cancelled',
        },
      },
      { new: true }
    );

    if (!order) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    // Check order was shipped. If shipped cancel order
    // if (order.shipping_method === 'shipped') {
    //   await cancelled_order(order.shipping_info.order_code);
    // }

    return res
      .status(StatusCodes.OK)
      .json({ message: messagesSuccess.REMOVE_ORDER_SUCCESS, data: order });
  } catch (error) {
    next(error);
  }
};
export {
  CreateOrder,
  GetAllOrders,
  GetOneOrder,
  RemoveOrder,
  UpdateOrder,
  GetOrderByUserId,
};
