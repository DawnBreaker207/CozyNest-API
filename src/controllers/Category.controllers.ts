import { RequestHandler } from 'express';
import Category from '../models/Category';
import { StatusCodes } from 'http-status-codes';
import { messageError, messagesSuccess } from '../constants/messages';

const Get_All_Category: RequestHandler = async (req, res, next) => {
  try {
    const data = await Category.find().populate('product');
    if (!data) {
      return res.status(StatusCodes.BAD_GATEWAY).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_CATEGORY_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Get_One_Category: RequestHandler = async (req, res, next) => {
  try {
    const data = await Category.findById(req.params.id).populate('product');
    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_PRODUCT_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Create_Category: RequestHandler = async (req, res, next) => {
  try {
    const data = await Category.create(req.body);
    if (!data) {
      return res.status(StatusCodes.BAD_GATEWAY).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CREATE_CATEGORY_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Update_Category: RequestHandler = async (req, res, next) => {
  try {
    const data = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_CATEGORY_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Hide_Category: RequestHandler = async (req, res, next) => {
  try {
    const data = await Category.findByIdAndUpdate(
      `${req.params.id}`,
      {
        isHidden: true,
      },
      { new: true }
    );
    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.UPDATE_CATEGORY_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};
const Delete_Category: RequestHandler = async (req, res, next) => {
  try {
    const data = await Category.findByIdAndDelete(req.params.id);
    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_CATEGORY_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

export {
  Get_All_Category,
  Get_One_Category,
  Create_Category,
  Update_Category,
  Hide_Category,
  Delete_Category,
};
