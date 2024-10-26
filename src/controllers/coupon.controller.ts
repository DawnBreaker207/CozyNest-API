import { messagesSuccess } from '@/constants/messages';
import {
  createCouponService,
  deleteCouponService,
  getAllCouponService,
  getOneCouponService,
  getValueCouponService,
  updateCouponService,
} from '@/services/coupon.service';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const createCoupon: RequestHandler = async (req, res, next) => {
  /**
   * @param {object} req.body Param body input
   */
  try {
    const coupon = createCouponService(req.body);
    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.CREATED,
      res: coupon,
    });
  } catch (error) {
    next(error);
  }
};

const getAllCoupon: RequestHandler = async (req, res, next) => {
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
    const page = typeof _page === 'string' ? parseInt(_page, 10) : 1;
    const limit = typeof _limit === 'string' ? parseInt(_limit, 10) : 9999;

    const sortField = typeof _sort === 'string' ? _sort : 'createAt';

    const options = {
      page: page,
      limit: limit,
      sort: {
        [sortField]: _order === 'desc' ? -1 : 1,
      },
      selected: ['-deleted', '-deletedAt'],
    };
    const docs = await getAllCouponService(
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
    next(error);
  }
};

const getOneCoupon: RequestHandler = async (req, res, next) => {
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
    next(error);
  }
};

const updateCoupon: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   * @param {string} req.user._id Param _id input
   */
  const { id } = req.params;
  const { _id } = req.user;
  try {
    const updateCoupon = await updateCouponService(id, _id, req.body);
    res.status(StatusCodes.OK).json({
      message: 'Update coupon success',
      res: updateCoupon,
    });
  } catch (error) {
    next(error);
  }
};

const getValueCoupon: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.coupon_code Param coupon_code input
   */
  const { coupon_code } = req.body;
  try {
    await getValueCouponService(coupon_code);

    res.status(StatusCodes.OK).json({
      message: 'Get value coupon success',
    });
  } catch (error) {
    next(error);
  }
};

const deleteCoupon: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   */
  const { id } = req.params;
  try {
    const coupon = deleteCouponService(id);
    res
      .status(StatusCodes.OK)
      .json({ message: 'Soft deleted success', res: coupon });
  } catch (error) {
    next(error);
  }
};

export {
  createCoupon,
  deleteCoupon,
  getAllCoupon,
  getOneCoupon,
  getValueCoupon,
  updateCoupon,
};
