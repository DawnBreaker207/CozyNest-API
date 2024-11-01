import { StatusCodes } from '@/http-status-codes';
import { CouponType } from '@/interfaces/Coupon';
import Coupon from '@/models/Coupon';
import { AppError } from '@/utils/errorHandle';
import { Types } from 'mongoose';
import moment from 'moment';
import logger from '@/utils/logger';
const getDate = (input?: Date): string => {
  return input
    ? moment(input).format('YYYY-MM-DD')
    : moment().format('YYYY-MM-DD');
};

const createCouponService = async (input: CouponType): Promise<CouponType> => {
  const coupon = await Coupon.create(input);
  if (!coupon) {
    logger.log('error', 'Coupon can not created in create coupon');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Error when created coupon');
  }
  return coupon;
};

const getAllCouponService = async (paginate: object, options: object) => {
  const coupon = await Coupon.paginate(paginate, options);
  if (coupon.docs.length === 0) {
    logger.log('error', 'Coupon is not found in get all coupon');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Can not find coupon');
  }
  return coupon;
};

const getOneCouponService = async (id: string): Promise<CouponType> => {
  const vouchers = await Coupon.findById(id);
  if (!vouchers) {
    logger.log('error', 'Coupon is not found in get one coupon');
    throw new AppError(StatusCodes.NOT_FOUND, 'Coupon not found');
  }
  return vouchers;
};

const updateCouponService = async (
  id: string,
  userId: Types.ObjectId,
  input: Partial<CouponType>,
): Promise<CouponType> => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    logger.log('error', 'Coupon is not found in update coupon');
    throw new AppError(StatusCodes.NOT_FOUND, 'Coupon not found');
  }
  coupon.set({ ...input, updateBy: userId });
  await coupon.save();
  return coupon;
};

const getValueCouponService = async (coupon_code: string) => {
  const currentDate = getDate();

  const voucher = await Coupon.findOne({
    $and: [{ couponCode: coupon_code, status: true }],
  });

  if (!voucher) {
    logger.log('error', 'Coupon is not found in get value coupon');
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found coupon');
  }
  if (voucher.couponQuantity === 0) {
    logger.log('error', 'Coupon was empty in get value coupon');
    throw new AppError(StatusCodes.BAD_GATEWAY, 'This coupon was empty');
  }
  const endDate = getDate(voucher.couponEndDate);
  const startDate = getDate(voucher.couponStartDate);
  if (currentDate > endDate) {
    logger.log('error', 'Coupon was ended in get value coupon');
    throw new AppError(StatusCodes.BAD_REQUEST, 'This voucher was ended');
  }
  if (currentDate < startDate) {
    logger.log('error', 'Coupon is not started in get value coupon');
    throw new AppError(StatusCodes.BAD_REQUEST, 'This voucher is not started');
  }
  return;
};

const deleteCouponService = async (id: string): Promise<CouponType> => {
  const coupon = await Coupon.findById(id);

  if (!coupon) {
    logger.log('error', 'Coupon is not found in delete coupon');
    throw new AppError(StatusCodes.NOT_FOUND, 'Coupon not found');
  }
  coupon.deleted = true;
  coupon.deletedAt = moment(new Date()).toDate();
  return await coupon.save();
};

export {
  createCouponService,
  getAllCouponService,
  getOneCouponService,
  updateCouponService,
  getValueCouponService,
  deleteCouponService,
};
