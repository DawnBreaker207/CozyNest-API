import {CouponType} from "@/interfaces/Coupon";
import Coupon from "@/models/Coupon";
import {AppError} from "@/utils/errorHandle";
import {StatusCodes} from "@/http-status-codes";
import {ObjectId} from "mongoose";


const couponCreate = async (input: CouponType): Promise<CouponType> => {
    const coupon = await Coupon.create(input);
    if (!coupon) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Error when created coupon');
    }
    return coupon
}


const couponGetAll = async (paginate: object, options: object) => {
    const coupon = await Coupon.paginate(paginate, options);
    if (coupon.docs.length === 0) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Can not find coupon');
    }
    return coupon;
}

const couponGetOne = async (id: string): Promise<CouponType> => {
    const vouchers = await Coupon.findById(id);
    if (!vouchers) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Coupon not found');
    }
    return vouchers
}
const couponUpdate = async (id: string, input: Partial<CouponType>, userId: ObjectId): Promise<CouponType> => {
    const coupon = await Coupon.findByIdAndUpdate(id, {...input, updatedBy: userId})

    if (!coupon) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Coupon not found');
    }
    return coupon
}
export {couponCreate, couponGetAll, couponGetOne, couponUpdate}