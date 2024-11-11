import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  createReviewService,
  deleteReviewService,
  getAllReviewsService,
  getReviewService,
} from '@/services/review.service';
import { messagesSuccess, messagesError } from '@/constants/messages';
import logger from '@/utils/logger';

// Tạo review mới
export const createReview: RequestHandler = async (req, res, next) => {
    try {
      const data = await createReviewService(req.body);
  
      return res.status(StatusCodes.CREATED).json({
        message: messagesSuccess.CREATE_REVIEW_SUCCESS,
        data,
      });
    } catch (error) {
      logger.log('error', `Error in createReview: ${error}`);
      next(error);
    }
  };

// Lấy tất cả các review
export const getAllReviews: RequestHandler = async (req, res, next) => {
  const { sku_id } = req.params;
  try {
    const data = await getAllReviewsService(sku_id);

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_REVIEW_SUCCESS,
      data,
    });
  } catch (error) {
    logger.log('error', `Error in getAllReviews: ${error}`);
    next(error);
  }
};

// Lấy chi tiết một review
export const getReview: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  try {
    const data = await getReviewService(id);

    if (!data) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_REVIEW_SUCCESS,
      data,
    });
  } catch (error) {
    logger.log('error', `Error in getReview: ${error}`);
    next(error);
  }
};

// Xóa review
export const deleteReview: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await deleteReviewService(id);

    if (!result) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_REVIEW_SUCCESS,
    });
  } catch (error) {
    logger.log('error', `Error in deleteReview: ${error}`);
    next(error);
  }
};
