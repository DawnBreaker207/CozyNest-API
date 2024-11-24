import { messagesSuccess } from '@/constants/messages';
import Coupon from '@/models/Coupon';
import {
  createCouponService,
  deleteCouponService,
  getAllCouponService,
  getOneCouponService,
  updateCouponService
} from '@/services/coupon.service';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';

import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';

export const createCoupon: RequestHandler = async (req, res, next) => {
  /**
   * @param {object} req.body Param body input
   */
  try {
    const coupon = await createCouponService(req.body);
    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.CREATED,
      res: coupon,
    });
  } catch (error) {
    logger.log('error', `Catch error in create coupon: ${error}`);
    next(error);
  }
};

export const getAllCoupon: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.query._page Param _page input
   * @param {string} req.query._order Param _order input
   * @param {number} req.query._limit Param _limit input
   * @param {string} req.query._sort Param _sort input
   * @param {string} req.query._status Param _status input
   * @param {string} req.query._name Param _name input
   */
  const {
    _page = 1,
    _order = 'asc',
    _limit = 10,
    _sort = 'createAt',
    _status = '',
    _name = '',
  } = req.query;
  try {
    const page = typeof _page === 'string' ? parseInt(_page, 10) : 1,
      limit = typeof _limit === 'string' ? parseInt(_limit, 10) : 9999,
      sortField = typeof _sort === 'string' ? _sort : 'createAt',
      options = {
        page,
        limit,
        sort: {
          [sortField]: _order === 'desc' ? -1 : 1,
        },
        selected: ['-deleted', '-deletedAt'],
      },
      docs = await getAllCouponService(
        {
          $and: [
            _name ? { name: new RegExp(_name as string, 'i') } : {},
            _status ? { status: JSON.parse(_status as string) } : {},
          ],
        },
        options,
      );
    res.status(StatusCodes.OK).json({
      message: 'Get all coupon success',
      res: docs,
    });
  } catch (error) {
    logger.log('error', `Catch error in get all coupon: ${error}`);
    next(error);
  }
};

export const getOneCoupon: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   */
  const { id } = req.params;
  try {
    const vouchers = await getOneCouponService(id);
    res.status(StatusCodes.OK).json({
      message: 'Get voucher success',
      res: vouchers,
    });
  } catch (error) {
    logger.log('error', `Catch error in get one coupon: ${error}`);
    next(error);
  }
};

export const updateCoupon: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   * @param {string} req.user._id Param _id input
   */
  const { id } = req.params,
    { _id } = req.user;
  try {
    const updateCoupon = await updateCouponService(id, _id, req.body);
    res.status(StatusCodes.OK).json({
      message: 'Update coupon success',
      res: updateCoupon,
    });
  } catch (error) {
    logger.log('error', `Catch error in update coupon: ${error}`);
    next(error);
  }
};

export const getValueCoupon: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.coupon_code Param coupon_code input
   */
  const { coupon_code } = req.body;
  try {
    const currentDate = moment().format('YYYY-MM-DD');

    const voucher = await Coupon.findOne({
      $and: [{ couponCode: coupon_code, status: true }],
    });

    if (!voucher) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Not found coupon');
    }
    if (voucher.couponQuantity === 0) {
      throw new AppError(StatusCodes.BAD_GATEWAY, 'This coupon was empty');
    }
    
    const endDate = moment(voucher.couponEndDate).format('YYYY-MM-DD');
    const startDate = moment(voucher.couponStartDate).format('YYYY-MM-DD');

    if (currentDate > endDate) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'This voucher was ended');
    }

    // Sửa điều kiện này để kiểm tra ngày bắt đầu
    if (currentDate < startDate) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'This voucher is not started'
      );
    }

    res.status(StatusCodes.OK).json({
      message: 'Get value coupon success',
      couponValue: voucher.couponValue,
      name: voucher.name
    });
  } catch (error) {
    logger.log('error', `Catch error in get value coupon: ${error}`);
    next(error);
  }
};

export const deleteCoupon: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   */
  const { id } = req.params;
  try {
    const coupon = await deleteCouponService(id);
    res
      .status(StatusCodes.OK)
      .json({ message: 'Soft deleted success', res: coupon });
  } catch (error) {
    logger.log('error', `Catch error in delete coupon: ${error}`);
    next(error);
  }
};
