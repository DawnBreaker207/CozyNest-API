import { messagesSuccess } from '@/constants/messages';
import Coupon from '@/models/Coupon';
import { AppError } from '@/utils/errorHandle';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';

const createCoupon: RequestHandler = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    if (!coupon) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Error when created coupon');
    }
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
    limit: _limit as number,
    sort: {
      [sortField]: _order === 'desc' ? -1 : 1,
    },
    selected: ['-deleted', '-deletedAt'],
  };
  try {
    const docs = await Coupon.paginate(
      {
        $and: [
          _name ? { name: new RegExp(_name as string, 'i') } : {},
          _status ? { status: JSON.parse(_status as string) } : {},
        ],
      },
      options
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
    const vouchers = await Coupon.findById(id);
    if (!vouchers) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Coupon not found');
    }
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
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Coupon not found');
    }
    coupon.set({ ...req.body, updateBy: req.user._id });
    await coupon.save();
    res.status(StatusCodes.OK).json({
      message: 'Update coupon success',
      res: coupon,
    });
  } catch (error) {
    next(error);
  }
};

const getValueCoupon: RequestHandler = async (req, res, next) => {
  try {
    const { coupon_code } = req.body;
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
    if (currentDate < endDate) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'This voucher is not started'
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
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Coupon not found');
    }
    coupon.deleted = true;
    coupon.deletedAt = moment(new Date()).toDate();
    await coupon.save();

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
  updateCoupon,
  getValueCoupon,
};
