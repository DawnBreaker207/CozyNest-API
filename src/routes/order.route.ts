import {
  addOneProduct_order,
  CreateOrder,
  deleteOneProduct_order,
  deleteProduct_order,
  getAll,
  getAllOrder,
  getOrderByPhoneNumber,
  getOrderByUserId,
  getReturnedOrder,
  returnedOrder,
  serviceFree,
  updatePaymentStatus,
  updateStatus,
} from "@/controllers/order.controller";
import { Router } from "express";

const routeOrder = Router();
routeOrder.put("/decrement", deleteOneProduct_order);
routeOrder.put("/increment", addOneProduct_order);
routeOrder.put("/decrement-product-order", deleteProduct_order);
routeOrder.post("/payment-status", updatePaymentStatus);
routeOrder.post("/calculateFee", serviceFree);
routeOrder.put("/orderByPhoneNumber", getOrderByPhoneNumber);
routeOrder.get("/orderByUserId", getOrderByUserId);
// routeOrder.post("/getTokenPrintBill", getTokenPrintBills);
routeOrder.post("/return", returnedOrder);
routeOrder.get("/return", getReturnedOrder);
// routeOrder.put("/return/:id", confirm_returnedOrder);
// routeOrder.put("/confirm-completed/:id", updateStatusDelivered);
routeOrder.post("/", CreateOrder);
routeOrder.get("/", getAll);
routeOrder.get("/statistical", getAllOrder);
// routeOrder.get("/shipping", getAllShipping);
// routeOrder.get("/:id", getOne);
// routeOrder.delete("/cancel/:id", cancelOrder);
// routeOrder.delete("/", delete_all_order);
routeOrder.put("/updateStatus/:id", updateStatus);
// routeOrder.put("/updateInfoCustomer/:id", update_info_customer);


export default routeOrder;
