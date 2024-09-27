import { messagesError, messagesSuccess } from '@/constants/messages';
import Category from '@/models/Category';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const Get_All_Category: RequestHandler = async (req, res, next) => {
  try {
    const data = await Category.find().populate('products');
    if (!data) {
      return res.status(StatusCodes.BAD_GATEWAY).json({
        message: messagesError.BAD_REQUEST,
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
    const data = await Category.findById(req.params.id).populate('products');
    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
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
        message: messagesError.BAD_REQUEST,
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
        message: messagesError.BAD_REQUEST,
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
        message: messagesError.BAD_REQUEST,
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
        message: messagesError.BAD_REQUEST,
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
  Create_Category, Delete_Category, Get_All_Category,
  Get_One_Category, Hide_Category, Update_Category
};

