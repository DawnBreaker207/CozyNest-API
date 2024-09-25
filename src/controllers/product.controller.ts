import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { messagesError, messagesSuccess } from '../constants/messages';
import Category from '../models/Category';
import { Product } from '../models/Product';

//* Products
const Get_All_Product: RequestHandler = async (req, res, next) => {
  try {
    const data = await Product.find().populate('category');
    if (!data) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.BAD_REQUEST });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_PRODUCT_SUCCESS,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};
const Get_One_Product: RequestHandler = async (req, res, next) => {
  try {
    const data = await Product.findById(req.params.id).populate('category');
    if (!data) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.BAD_REQUEST });
    }
    res.status(StatusCodes.CREATED).json({
      res: messagesSuccess.GET_PRODUCT_SUCCESS,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};
const Create_Product: RequestHandler = async (req, res, next) => {
  try {
    const data = await Product.create(req.body);
    const updateCategory = await Category.findByIdAndUpdate(
      data.category,
      {
        $push: { products: data._id },
      },
      { new: true }
    );
    if (!data || !updateCategory) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    res.status(200).json({
      message: messagesSuccess.CREATE_PRODUCT_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Update_Product: RequestHandler = async (req, res, next) => {
  try {
    const data = await Product.findByIdAndUpdate(`${req.params.id}`, req.body, {
      new: true,
    });
    if (!data) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.BAD_REQUEST });
    }
    const updateCategory = await Category.findByIdAndUpdate(
      data.category,
      {
        $push: { products: data._id },
      },
      { new: true }
    );
    if (!data || !updateCategory) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.UPDATE_PRODUCT_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Hide_Product: RequestHandler = async (req, res, next) => {
  try {
    const data = await Product.findByIdAndUpdate(
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
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_PRODUCT_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Delete_Product: RequestHandler = async (req, res, next) => {
  try {
    const data = await Product.findByIdAndDelete(req.params.id);
    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_PRODUCT_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

export {
  Create_Product,
  Delete_Product,
  Get_All_Product,
  Get_One_Product,
  Hide_Product,
  Update_Product,
};
