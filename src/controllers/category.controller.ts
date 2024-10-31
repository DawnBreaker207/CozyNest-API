import { messagesError, messagesSuccess } from '@/constants/messages';
import Category from '@/models/Category';
import {
  createCategoryService,
  deleteCategoryService,
  getOneCategoryService,
  hideCategoryService,
  updateCategoryService,
} from '@/services/category.service';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import logger from '@/utils/logger';

const Get_All_Category: RequestHandler = async (req, res, next) => {
  /**
   * @param {object} req.query query object input
   */
  try {
    const category = await Category.find({
      name: {
        $regex: req.query['_q'] || '',
        $options: 'i',
      },
    }).populate('products');
    if (!category || category.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_CATEGORY_SUCCESS,
      res: category,
    });
  } catch (error) {
    logger.log('error', `Catch error in get all category: ${error}`);
    next(error);
  }
};

const Get_One_Category: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   */
  const id = req.params.id;
  try {
    const category = await getOneCategoryService(id);
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_PRODUCT_SUCCESS,
      res: category,
    });
  } catch (error) {
    logger.log('error', `Catch error in get one category: ${error}`);
    next(error);
  }
};

const Create_Category: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.type category type input
   */
  const { type } = req.body;
  try {
    const category = await createCategoryService(type, req.body);
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CREATE_CATEGORY_SUCCESS,
      res: category,
    });
  } catch (error) {
    logger.log('error', `Catch error in create category: ${error}`);
    next(error);
  }
};

const Update_Category: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Id of the category
   * @param {object} req.body type of category
   */
  const id = req.params.id;
  try {
    const category = updateCategoryService(id, req.body);

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_CATEGORY_SUCCESS,
      res: category,
    });
  } catch (error) {
    logger.log('error', `Catch error in update category: ${error}`);
    next(error);
  }
};

const Hide_Category: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Id of the category
   */
  const id = req.params.id;
  try {
    await hideCategoryService(id);
    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.UPDATE_CATEGORY_SUCCESS,
    });
  } catch (error) {
    logger.log('error', `Catch error in hide category: ${error}`);
    next(error);
  }
};

const Delete_Category: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Id of the category
   */
  const id = req.params.id;
  try {
    await deleteCategoryService(id);
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_CATEGORY_SUCCESS,
    });
  } catch (error) {
    logger.log('error', `Catch error in delete category: ${error}`);
    next(error);
  }
};

export {
  Create_Category,
  Delete_Category,
  Get_All_Category,
  Get_One_Category,
  Hide_Category,
  Update_Category,
};
