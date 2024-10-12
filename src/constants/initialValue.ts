// import { PermissionList, RolePermissions } from '../interfaces/Permissions';

// export const permissions: RolePermissions = {
//   admin: [
//     PermissionList.CREATE_PRODUCT,
//     PermissionList.UPDATE_PRODUCT,
//     PermissionList.DELETE_PRODUCT,
//     PermissionList.VIEW_PRODUCT,
//     PermissionList.LIST_PRODUCTS,
//     PermissionList.CREATE_CATEGORY,
//     PermissionList.UPDATE_CATEGORY,
//     PermissionList.DELETE_CATEGORY,
//     PermissionList.VIEW_CATEGORY,
//     PermissionList.LIST_CATEGORIES,
//     PermissionList.CREATE_ORDER,
//     PermissionList.VIEW_ORDER,
//     PermissionList.LIST_ORDERS,
//     PermissionList.UPDATE_ORDER_STATUS,
//     PermissionList.CREATE_USER,
//     PermissionList.UPDATE_USER,
//     PermissionList.DELETE_USER,
//     PermissionList.LIST_USERS,
//     PermissionList.VIEW_CART,
//     PermissionList.DELETE_CART,
//   ],
//   manager: [
//     PermissionList.CREATE_PRODUCT,
//     PermissionList.UPDATE_PRODUCT,
//     PermissionList.VIEW_PRODUCT,
//     PermissionList.LIST_PRODUCTS,
//     PermissionList.CREATE_ORDER,
//     PermissionList.VIEW_ORDER,
//     PermissionList.LIST_ORDERS,
//     PermissionList.VIEW_CART,
//   ],
//   user: [
//     PermissionList.VIEW_PRODUCT,
//     PermissionList.LIST_PRODUCTS,
//     PermissionList.VIEW_CATEGORY,
//     PermissionList.LIST_CATEGORIES,
//     PermissionList.CREATE_ORDER,
//     PermissionList.VIEW_ORDER,
//     PermissionList.CREATE_CART,
//     PermissionList.UPDATE_CART,
//     PermissionList.DELETE_CART,
//     PermissionList.VIEW_CART,
//   ],
// };
// export const roles = {
//   admin: [
//     ...permissions.user,
//     ...permissions.manager,
//     permissions.admin,
//   ] as PermissionList[],
//   manager: [...permissions.user, ...permissions.manager] as PermissionList[],
//   user: [...permissions.user] as PermissionList[],
// };
// export const rolePermission: RolePermissions = {
//   admin: roles.admin,
//   manager: roles.manager,
//   user: roles.user,
// };

// export const sizes = ['S', 'M', 'L', 'XL'];

// export const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Green'];

export const timeCounts = Object.freeze({
  mins_5: 5 * 60 * 1000,
  mins_10: 10 * 60 * 1000,
  mins_15: 15 * 60 * 1000,
  hours_24: 24 * 60 * 60 * 1000,
});

export const statusOrder: readonly string[] = [
  'Pending', //Chờ xác nhận
  'Shipping', //Đang vận chuyển
  'Delivered', //Giao hàng thành công
  'Completed', //Đơn hàng hoàn thành
  'Canceled', //Đã hủy đơn hàng
];
export const paymentMethod: readonly string[] = [
  'COD', // Thanh toán khi nhận hàng
  'MoMo', //Thanh toán qua Momo
  'VNPay', //Thanh toán VnPay
  'ZaloPay' //Thanh toán ZaloPay
];
