import { paymentMethod, statusOrder } from "@/constants/initialValue";
import { messagesError, messagesSuccess } from "@/constants/messages";
import { OrderType } from "@/interfaces/Order";
import Cart from "@/models/Cart";
import Order, { OrderItem, ShippingInfo } from "@/models/Order";
import { Sku } from "@/models/Sku";
import { filterOrderDay, sendOrderMail } from "@/utils/order";
import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { createMomo, createVnPay, createZaloPay } from "./payment.controller";

//! Client

const buildPaymentMethod = (method: string) => {
  switch (method) {
    case "cash":
      return {
        method: "Thanh toán khi nhận hàng",
        status: "unpaid",
        orderInfo: "Thanh toán trực tiếp",
        orderType: "cash",
        partnerCode: "TIENMAT",
      };
    case "momo":
      return {
        method: "Thanh toán qua ví MOMO",
        status: "unpaid",
        orderInfo: "Thanh toán qua MOMO",
        orderType: "bank_transfer",
        partnerCode: "BANKTRANSFER",
      };
    case "vnpay":
      return {
        method: "Thanh toán qua VNPAY",
        status: "unpaid",
        orderInfo: "Thanh toán qua VNPAY",
        orderType: "vnpay",
        partnerCode: "VNPAY",
      };
    case "zalopay":
      return {
        method: "Thanh toán qua ZALOPAY",
        status: "unpaid",
        orderInfo: "Thanh toán qua ZALOPAY",
        orderType: "zalopay",
        partnerCode: "ZALOPAY",
      };
    default:
      throw new Error("Phương thức thanh toán không hợp lệ");
  }
};

const createShippingInfo = async (
  order: any,
  address: string,
  shipping_address: string,
  transportation_fee: number
) => {
  const detail_address = `${address},${shipping_address}`;
  const shippingInfo = await ShippingInfo.create({
    shipping_address: detail_address,
    transportation_fee,
  });
  order.shipping_info = shippingInfo._id;
  await order.save();
};

const CreateOrder: RequestHandler = async (req, res, next) => {
  try {
    const {
      address,
      shipping_address,
      payment_method,
      total_amount,
      transportation_fee = 3000,
      guestId,
      cart_id,
      ...body
    } = req.body;

    let paymentMethod;
    try {
      paymentMethod = buildPaymentMethod(payment_method);
    } catch (error: any) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error.message });
    }

    // Kiểm tra phương thức thanh toán và gọi API tương ứng
    let payUrl: string | undefined;
    try {
      switch (payment_method) {
        case "momo":
          const momoResponse: any = await createMomo(req, res, next);
          payUrl = momoResponse?.payUrl ?? "";
          break;

        case "zalopay":
          const zalopayResponse: any = await createZaloPay(req, res, next);
          payUrl = zalopayResponse?.payUrl ?? "";
          break;

        case "vnpay":
          const vnpayResponse: any = await createVnPay(req, res, next);
          payUrl = vnpayResponse?.payUrl ?? "";
          break;
        default:
          throw new Error("Phương thức thanh toán không hợp lệ");
      }

      // Kiểm tra xem payUrl có hợp lệ không
      if (!payUrl) {
        throw new Error("Không thể lấy liên kết thanh toán từ phản hồi.");
      }
    } catch (error: any) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: error.message });
    }

    // Tạo đơn hàng với thông tin thanh toán
    const order = await Order.create({
      ...body,
      total_amount: Number(total_amount) + transportation_fee,
      payment_method: paymentMethod,
      payment_url: payUrl, // Đính kèm liên kết thanh toán
    });

    // Tạo thông tin giao hàng nếu phương thức giao hàng là "shipped"
    if (order.shipping_method === "shipped") {
      await createShippingInfo(
        order,
        address,
        shipping_address,
        transportation_fee
      );
    }

    // Cập nhật giỏ hàng
    await Cart.findOneAndUpdate(
      { cart_id },
      { $set: { products: [], total_money: 0 } }
    );

    // Trả về phản hồi đơn hàng cùng với liên kết thanh toán
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CREATE_ORDER_SUCCESS,
      res: {
        ...order.toObject(),
        payment_method: order.payment_method,
        payment_url: order.payment_url, // Đính kèm liên kết thanh toán
      },
    });
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    next(error);
  }
};

const updatePaymentStatus: RequestHandler  = async (req, res, next) => {
  try {
    const { _id, orderInfo } = req.body;
    const order = await Order.findByIdAndUpdate(_id, {
      $set: {
        payment_status: "paid",
        payment_method: req.body,
      },
    });
    if (!order) {
      throw new Error("Không tim thấy đơn hàng");
    }
    return res.json({
      status: 200,
      message: "Thành công",
    });
  } catch (error) {
    next(error);
  }
};
const RemoveOrder: RequestHandler = async (req, res, next) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res
      .status(StatusCodes.NO_CONTENT)
      .json({ message: messagesSuccess.REMOVE_ORDER_SUCCESS });
  } catch (error) {
    next(error);
  }
};

//! For admin

// const GetAllOrders: RequestHandler = async (req, res, next) => {
//   const {
//     _page = 1,
//     _order = 'asc',
//     _limit = 9999,
//     _sort = 'createAt',
//     _status = '',
//     _day,
//     _invoiceId = '',
//   } = req.query;
//   const page = typeof _page === 'string' ? parseInt(_page, 10) : 1;
//   const limit = typeof _limit === 'string' ? parseInt(_limit, 10) : 9999;

//   const sortField = typeof _sort === 'string' ? _sort : 'createAt';

//   let day: number | undefined;

//   if (_day) {
//     // Kiểm tra xem _day có phải là chuỗi không
//     if (typeof _day === 'string') {
//       day = parseInt(_day, 10); // Chuyển đổi chuỗi thành số
//     }
//     // Kiểm tra xem _day có phải là mảng không
//     else if (Array.isArray(_day) && _day.length > 0) {
//       // Kiểm tra phần tử đầu tiên có phải là chuỗi không
//       if (typeof _day[0] === 'string') {
//         day = parseInt(_day[0], 10); // Lấy phần tử đầu tiên của mảng và chuyển đổi thành số
//       }
//     }
//   }

//   const options = {
//     page: page,
//     limit: limit,
//     sort: { [sortField]: _order === 'desc' ? -1 : 1 },
//   };

//   try {
//     const query: any = {};

//     if (_status) {
//       query.status = _status;
//     }
//     const data = await Order.paginate(query, options);
//     if (_invoiceId) {
//       const data = await Order.find({ invoiceId: _invoiceId });
//       if (!data) {
//         return res
//           .status(StatusCodes.NOT_FOUND)
//           .json({ message: messagesError.NOT_FOUND, res: [] });
//       }
//       return res.status(StatusCodes.CREATED).json({
//         message: messagesSuccess.GET_ORDER_SUCCESS,
//         res: data,
//       });
//     }

//     if (day) {
//       filterOrderDay(data.docs, day, res);
//       return;
//     }

//     if (data.docs.length === 0) {
//       return res.status(StatusCodes.OK).json({
//         message: messagesSuccess.GET_ORDER_SUCCESS,
//         res: [],
//       });
//     }

//     res.status(StatusCodes.OK).json({
//       message: messagesSuccess.GET_ORDER_SUCCESS,
//       res: {
//         data: data.docs,
//         pagination: {
//           currentPage: data.page,
//           totalPages: data.totalPages,
//           totalItems: data.totalDocs,
//         },
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const GetOneOrder: RequestHandler = async (req, res, next) => {
//   const { id } = req.params;
//   try {
//     if (!id) {
//       return res.status(StatusCodes.NOT_FOUND).json;
//     }
//     const order = await Order.findById(id).exec();

//     if (!order) {
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json({ message: messagesError.BAD_REQUEST });
//     }

//     res.status(StatusCodes.OK).json({
//       message: messagesSuccess.GET_ORDER_SUCCESS,
//       res: order,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const GetOrderByUserId: RequestHandler = async (req, res, next) => {
//   try {
//     const {
//       _page = 1,
//       _sort = 'created_at',
//       _order = 'desc',
//       _limit = 10,
//       status,
//       userId,
//     } = req.query;

//     const query: any = {};
//     if (status) {
//       query.status = status;
//     }
//     if (userId && mongoose.Types.ObjectId.isValid(userId as string)) {
//       query.userId = new mongoose.Types.ObjectId(userId as string);
//     }
//     const page = typeof _page === 'string' ? parseInt(_page, 10) : 1;
//     const limit = typeof _limit === 'string' ? parseInt(_limit, 10) : 9999;
//     const sortField = typeof _sort === 'string' ? _sort : 'createAt';
//     const options = {
//       page: page,
//       limit: limit,
//       sort: {
//         [sortField]: _order === 'desc' ? -1 : 1,
//       },
//       select: ['-deleted', '-deleted_at'],
//     };
//     const { docs, ...paginate } = await Order.paginate(query, options);
//     if (!docs || docs.length === 0) {
//       return res.status(StatusCodes.NO_CONTENT).json({
//         message: messagesSuccess.NO_CONTENT,
//       });
//     }

//     res.status(StatusCodes.OK).json({
//       message: messagesSuccess.GET_ORDER_SUCCESS,
//       res: {
//         orders: docs,
//         paginate,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const UpdateOrder: RequestHandler = async (req, res, next) => {
//   try {
//     const orderId = req.params.id;
//     const {
//       status,
//       userId,
//       customerName,
//       phoneNumber,
//       email,
//       addressShipping,
//     } = req.body;

//     if (!status) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         message: messagesError.BAD_REQUEST,
//       });
//     }

//     const currentOrder = await Order.findById(orderId);
//     if (!currentOrder) {
//       return res.status(StatusCodes.NOT_FOUND).json({
//         message: messagesError.NOT_FOUND,
//         res: [],
//       });
//     }

//     if (
//       status === messagesError.ORDER_FAILED &&
//       (currentOrder.status === 'Completed' ||
//         currentOrder.status === 'Delivered')
//     ) {
//       return res.status(StatusCodes.FORBIDDEN).json({
//         message: messagesError.FORBIDDEN,
//       });
//     }

//     if (
//       !statusOrder.includes(status) &&
//       status !== messagesError.ORDER_FAILED
//     ) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         message: messagesError.BAD_REQUEST,
//       });
//     }

//     const updateData = await Order.findByIdAndUpdate(
//       orderId,
//       {
//         ...req.body,
//         userId: userId ? new mongoose.Types.ObjectId(userId) : null,
//         customerName: customerName || currentOrder.customerName,
//         phoneNumber: phoneNumber || currentOrder.phoneNumber,
//         email: email || currentOrder.email,
//         addressShipping: addressShipping || currentOrder.addressShipping,
//       },
//       { new: true }
//     );

//     if (status === messagesError.ORDER_CANCELED) {
//     }
//     if (updateData?.email) {
//       try {
//         await sendOrderMail(updateData?.email, updateData);
//       } catch (error) {
//         next(error);
//       }
//     }

//     res.status(StatusCodes.OK).json({
//       message: messagesSuccess.UPDATE_ORDER_SUCCESS,
//       res: updateData,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const CancelOrder: RequestHandler = async (req, res, next) => {
//   try {
//     const id = req.params.id;
//     const ordered = await Order.findById(id);
//     // Cancel
//     if (ordered?.status === 'Canceled') {
//       return res.status(StatusCodes.ACCEPTED).json({
//         message: messagesSuccess.ORDER_SUCCESS_MESSAGE,
//       });
//     }
//     if (ordered?.status === 'Delivering') {
//       return res.status(StatusCodes.ACCEPTED).json({
//         message: messagesSuccess.ORDER_SUCCESS_MESSAGE,
//       });
//     }
//     if (ordered?.status === 'Return') {
//       return res.status(StatusCodes.ACCEPTED).json({
//         message: messagesSuccess.ORDER_SUCCESS_MESSAGE,
//       });
//     }
//     if (!ordered) {
//       return res.status(StatusCodes.ACCEPTED).json({
//         message: messagesSuccess.ORDER_SUCCESS_MESSAGE,
//       });
//     }
//     const order = await Order.findByIdAndUpdate(
//       id,
//       {
//         $set: { status: 'cancelled' },
//         $push: {
//           status: 'cancelled',
//         },
//       },
//       { new: true }
//     );

//     if (!order) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         message: messagesError.BAD_REQUEST,
//       });
//     }
//     // Check order was shipped. If shipped cancel order
//     // if (order.shipping_method === 'shipped') {
//     //   await cancelled_order(order.shipping_info.order_code);
//     // }

//     return res
//       .status(StatusCodes.OK)
//       .json({ message: messagesSuccess.REMOVE_ORDER_SUCCESS, data: order });
//   } catch (error) {
//     next(error);
//   }
// };
const updateStatus: RequestHandler = async (req, res, next) => {
  try {
    const orderId: string = req.params.id; // Lấy ID của đơn hàng từ params
    const { status }: { status: string } = req.body; // Lấy trạng thái mới từ body của request

    // Danh sách các trạng thái hợp lệ
    const validStatusList = [
      "processing",
      "confirmed",
      "delivering",
      "cancelled",
      "delivered",
      "returned",
    ];

    // Kiểm tra trạng thái hợp lệ
    if (!validStatusList.includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Trạng thái không hợp lệ",
      });
    }

    // Tìm đơn hàng trong db
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Kiểm tra trạng thái hiện tại
    if (existingOrder.status === "cancelled") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Không thể cập nhật đơn hàng đã bị hủy",
      });
    }

    if (existingOrder.status === "delivered") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Không thể cập nhật đơn hàng đã hoàn thành",
      });
    }

    // Kiểm tra nếu trạng thái mới giống với trạng thái hiện tại
    if (existingOrder.status === status) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: `Đơn hàng đã ở trạng thái ${status}`,
      });
    }

    // Nếu trạng thái là "returned" mà đơn hàng chưa được giao
    if (status === "returned" && existingOrder.status !== "delivered") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Không thể trả lại đơn hàng chưa được giao",
      });
    }

    // Cập nhật trạng thái đơn hàng và ghi lại lịch sử trạng thái
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: { status: status }, // Cập nhật trạng thái mới
        $push: {
          status_detail: {
            status: status, // Ghi lại lịch sử trạng thái
            date: new Date(), // Ghi lại thời gian cập nhật
          },
        },
      },
      { new: true } // Tùy chọn này trả về đối tượng đã được cập nhật
    );

    if (!updatedOrder) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Cập nhật trạng thái thất bại",
      });
    }

    // Trả về phản hồi thành công
    return res.status(StatusCodes.OK).json({
      message: "Cập nhật trạng thái thành công",
      data: updatedOrder,
    });
  } catch (error) {
    // Bắt lỗi và chuyển tiếp tới middleware xử lý lỗi
    next(error);
  }
};

export {
  CreateOrder,
  // GetAllOrders,
  // GetOneOrder,
  // GetOrderByUserId,
  RemoveOrder,
  updateStatus,
  updatePaymentStatus
};
