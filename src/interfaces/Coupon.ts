export interface CouponType {
  name: string;
  couponCode: string;
  couponValue: number;
  couponQuantity: number;
  couponStartDate: Date;
  couponEndDate: Date;
  status: boolean;
  createdBy: string;
  updatedBy: string;
  deleted: boolean;
  deletedAt: Date;
}
