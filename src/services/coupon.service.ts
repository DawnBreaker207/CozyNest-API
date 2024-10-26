import { StatusCodes } from '@/http-status-codes';
import { CouponType } from '@/interfaces/Coupon';
import Coupon from '@/models/Coupon';
import moment from '@/moment/ts3.1-typings/moment';
import { AppError } from '@/utils/errorHandle';
import { Types } from 'mongoose';

const couponCreate = async (input: CouponType): Promise<CouponType> => {
  const coupon = await Coupon.create(input);
  if (!coupon) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Error when created coupon');
  }
  return coupon;
};

const couponGetAll = async (paginate: object, options: object) => {
  const coupon = await Coupon.paginate(paginate, options);
  if (coupon.docs.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Can not find coupon');
  }
  return coupon;
};

const couponGetOne = async (id: string): Promise<CouponType> => {
  const vouchers = await Coupon.findById(id);
  if (!vouchers) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Coupon not found');
  }
  return vouchers;
};
const couponUpdate = async (
  id: string,
  input: Partial<CouponType>,
  userId: Types.ObjectId,
): Promise<CouponType> => {
  const coupon = await Coupon.findByIdAndUpdate(id, {
    ...input,
    updatedBy: userId,
  });

  if (!coupon) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Coupon not found');
  }
  return coupon;
};

const getDate = (input?: Date): string => {
  return input
    ? moment(input).format('YYYY-MM-DD')
    : moment().format('YYYY-MM-DD');
};
const getOneVoucher = async (
  input: Partial<CouponType>,
): Promise<CouponType> => {
  const voucher = await Coupon.findOne({
    $and: [{ couponCode: input, status: true }],
  });

  if (!voucher) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found coupon');
  }
  if (voucher.couponQuantity === 0) {
    throw new AppError(StatusCodes.BAD_GATEWAY, 'This coupon was empty');
  }
  return voucher;
};

const softDeleteCoupon = async (id: string): Promise<CouponType> => {
  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Coupon not found');
  }
  coupon.deleted = true;
  coupon.deletedAt = moment(new Date()).toDate();
  return await coupon.save();
};
export {
  couponCreate,
  couponGetAll,
  couponGetOne,
  couponUpdate,
  getDate,
  getOneVoucher,
  softDeleteCoupon
};
