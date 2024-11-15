import { messagesSuccess } from '@/constants/messages';
import {
  GetAllCategoriesService,
  createCategoryService,
  deleteCategoryService,
  getOneCategoryService,
  hideCategoryService,
  updateCategoryService,
} from '@/services/category.service';
import logger from '@/utils/logger';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

export const getAllCategories: RequestHandler = async (req, res, next) => {
  /**
   * @param {object} req.query query object input
   */
  try {
    const category = await GetAllCategoriesService(req.query);
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_CATEGORY_SUCCESS,
      res: category,
    });
  } catch (error) {
    logger.log('error', `Catch error in get all categories: ${error}`);
    next(error);
  }
};

export const getOneCategory: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   */
  const { id } = req.params;
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

export const createCategory: RequestHandler = async (req, res, next) => {
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

export const updateCategory: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Id of the category
   * @param {object} req.body type of category
   */
  const { id } = req.params;
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

export const softDeleteCategory: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Id of the category
   */
  const { id } = req.params;
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

export const hardDeleteCategory: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Id of the category
   */
  const { id } = req.params;
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
