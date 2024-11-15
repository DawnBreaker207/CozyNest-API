import {
  createCoupon,
  deleteCoupon,
  getAllCoupon,
  getOneCoupon,
  getValueCoupon,
  updateCoupon,
} from '@/controllers/coupon.controller';
import { checkAuth } from '@/middlewares/checkAuth';
import { checkPermission } from '@/middlewares/checkPermission';
import { Router } from 'express';

const routeCoupon = Router();

// Get all coupon
routeCoupon.get(
  '/',
  // #swagger.tags = ['Coupon']
  getAllCoupon,
);

// Get one coupon
routeCoupon.get(
  '/:id',
  // #swagger.tags = ['Coupon']
  getOneCoupon,
);

// Get value in coupon
routeCoupon.get(
  '/couponValue',
  checkAuth,
  // #swagger.tags = ['Coupon']
  getValueCoupon,
);

// Create new coupon
routeCoupon.post(
  '/',
  checkAuth,
  // #swagger.tags = ['Coupon']
  createCoupon,
);

// Update coupon
routeCoupon.patch(
  '/:id',
  checkAuth,
  // #swagger.tags = ['Coupon']
  updateCoupon,
);

// Soft delete coupon
routeCoupon.delete(
  '/:id',
  checkAuth,
  checkPermission,
  // #swagger.tags = ['Coupon']
  deleteCoupon,
);
export default routeCoupon;
