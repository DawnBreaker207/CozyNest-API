import { RequestHandler } from 'express';
import Category from '../models/Category';
import { StatusCodes } from 'http-status-codes';
import { messageError, messagesSuccess } from '../constants/messages';
import { Product } from '../models/Product';

const Get_All_Category: RequestHandler = async (req, res, next) => {
  try {
    const category = await Category.find({
      name: {
        $regexp: req.query['_q'] || '',
        $option: 'i',
      },
    }).populate('product');
    if (!category || category.length === 0) {
      return res.status(StatusCodes.BAD_GATEWAY).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_CATEGORY_SUCCESS,
      res: category,
    });
  } catch (error) {
    next(error);
  }
};
const Get_One_Category: RequestHandler = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).populate('product');
    if (!category) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_PRODUCT_SUCCESS,
      res: category,
    });
  } catch (error) {
    next(error);
  }
};
const Create_Category: RequestHandler = async (req, res, next) => {
  try {
    // Check if there have any initial value
    const defaultCategory = await Category.find({ type: req.body.type });
    if (defaultCategory && defaultCategory.type == 'default') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }

    const category = await Category.create(req.body);
    if (!category) {
      return res.status(StatusCodes.BAD_GATEWAY).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CREATE_CATEGORY_SUCCESS,
      res: category,
    });
  } catch (error) {
    next(error);
  }
};
const Update_Category: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existCategory = await Category.findById({ _id: id });

    if (!existCategory) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }

    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_CATEGORY_SUCCESS,
      res: category,
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
    const category = await Category.findOne({ _id: req.params.id });

    // Can't delete default category
    const defaultCategory = await Category.findOne({ type: 'default' });
    if (!defaultCategory) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    if (category?.type === 'default') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    const defaultCategoryId = defaultCategory._id;

    // Update multiple products
    await Product.updateMany(
      { category: category?._id },
      { $set: { category: defaultCategoryId } }
    );

    // Add product Id to default category

    await Category.findByIdAndUpdate(
      defaultCategoryId,
      {
        $push: { products: category?.products },
      },
      { new: true }
    );

    // Remove category with id
    const removeCategory = await Category.findByIdAndDelete({
      _id: req.params.id,
    });
    
    if (!removeCategory) {
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
