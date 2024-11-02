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
routeCoupon.get('/', getAllCoupon);

// Get one coupon
routeCoupon.get('/:id', getOneCoupon);

// Get value in coupon
routeCoupon.get('/couponValue', checkAuth, getValueCoupon);

// Create new coupon
routeCoupon.post('/', checkAuth, createCoupon);

// Update coupon
routeCoupon.patch('/:id', checkAuth, updateCoupon);

// Soft delete coupon
routeCoupon.delete('/:id', checkAuth, checkPermission, deleteCoupon);
export default routeCoupon;
