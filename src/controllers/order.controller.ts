import { messagesError, messagesSuccess } from '@/constants/messages';
import Order from '@/models/Order';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const GetAllOrder: RequestHandler = async (req, res, next) => {
  try {
    const data = await Order.find();
    if (!data) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.BAD_REQUEST });
    }
    res
      .status(StatusCodes.OK)
      .json({ message: messagesSuccess.GET_ORDER_SUCCESS, res: data });
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
export { CreateOrder, GetAllOrder, GetOrder, RemoveOrder };

