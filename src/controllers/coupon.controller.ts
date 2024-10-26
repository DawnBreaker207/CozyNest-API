import { messagesSuccess } from '@/constants/messages';
import {
  couponCreate,
  couponGetAll,
  couponGetOne,
  couponUpdate,
  getDate,
  getOneVoucher,
  softDeleteCoupon,
} from '@/services/coupon.service';
import { AppError } from '@/utils/errorHandle';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const createCoupon: RequestHandler = async (req, res, next) => {
  try {
    const coupon = couponCreate(req.body);
    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.CREATED,
      res: coupon,
    });
  } catch (error) {
    next(error);
  }
};

const getAllCoupon: RequestHandler = async (req, res, next) => {
  const {
    _page = 1,
    _order = 'asc',
    _limit = 10,
    _sort = 'createAt',
    _status = '',
    _name = '',
  } = req.query;
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
  try {
    const docs = await couponGetAll(
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
  try {
    const { id } = req.params;
    const vouchers = await couponGetOne(id);
    res.status(StatusCodes.OK).json({
      message: 'Get voucher success',
      res: vouchers,
    });
  } catch (error) {
    next(error);
  }
};

const updateCoupon: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    await couponGetOne(id);

    const updateCoupon = await couponUpdate(id, req.body, userId);
    res.status(StatusCodes.OK).json({
      message: 'Update coupon success',
      res: updateCoupon,
    });
  } catch (error) {
    next(error);
  }
};

const getValueCoupon: RequestHandler = async (req, res, next) => {
  try {
    const { coupon_code } = req.body;
    const currentDate = getDate();

    const voucher = await getOneVoucher(coupon_code);
    const endDate = getDate(voucher.couponEndDate);
    const startDate = getDate(voucher.couponStartDate);
    if (currentDate > endDate) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'This voucher was ended');
    }
    if (currentDate < startDate) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'This voucher is not started',
      );
    }

    res.status(StatusCodes.OK).json({
      message: 'Get value coupon success',
    });
  } catch (error) {
    next(error);
  }
};

const deleteCoupon: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = softDeleteCoupon(id);
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
