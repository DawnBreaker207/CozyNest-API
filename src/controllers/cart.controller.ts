import {
  AddToCartService,
  createCartService,
  decreaseQuantityService,
  GetByIdService,
  GetCartService,
  increaseQuantityService,
  RemoveCartService,
  RemoveFromCartService,
} from '@/services/cart.service';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { messagesSuccess } from '../constants/messages';

// Create cart
const createCart: RequestHandler = async (req, res, next) => {
  /**
   * @param {object} req.body Param cart input
   */
  try {
    const newCart = await createCartService(req.body);

    return res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.CREATED,
      res: newCart,
    });
  } catch (error) {
    next(error);
  }
};

// Get cart by user id
const GetCart: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.userId Param userId input
   */
  const { userId } = req.params;
  try {
    const { SKUs, new_cart } = await GetCartService(userId);

    // const cartData = {
    //   cartId: cart?.id,
    //   products: cart?.products.map((item) => ({
    //     productId: item.productId,
    //     quantity: item.quantity,
    //     price: item.price,
    //   })),
    // };

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_CART_SUCCESS,
      // res: cartData,
      res: { ...new_cart, products: SKUs },
    });
  } catch (error) {
    next(error);
  }
};

// Get cart by user id
const GetById: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.userId Param userId input
   */
  const { userId } = req.params;
  try {
    const cartData = await GetByIdService(userId);

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_CART_SUCCESS,
      res: cartData,
    });
  } catch (error) {
    next(error);
  }
};

// Add product to cart = create cart
const AddToCart: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.userId Param userId input
   * @param {string} req.body.guestId Param guestId input
   * @param {string} req.body.sku_id Param sku_id input
   * @param {number} req.body.quantity Param quantity input
   */
  const { userId, guestId, sku_id, quantity } = req.body;
  try {
    const cart = AddToCartService(userId, guestId, sku_id, quantity);

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.ADD_CART_SUCCESS,
      res: cart,
    });
  } catch (error) {
    next(error);
  }
};

// Remove product from cart = delete product
const RemoveFromCart: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.userId Param userId input
   * @param {string} req.body.sku_id Param sku_id input
   */
  const { userId, sku_id } = req.body;
  try {
    const cart = await RemoveFromCartService(userId, sku_id);
    return res
      .status(StatusCodes.CREATED)
      .json({ message: messagesSuccess.REMOVE_CART_ITEMS_SUCCESS, res: cart });
  } catch (error) {
    next(error);
  }
};

// Remove cart = delete cart
const RemoveCart: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   */
  const { id } = req.params;
  try {
    await RemoveCartService(id);

    res.status(StatusCodes.NO_CONTENT).json({
      message: messagesSuccess.REMOVE_CART_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

// Increase quantity = add one product quantity
const increaseQuantity: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.userId Param userId input
   * @param {string} req.body.sku_id Param sku_id input
   */
  const { userId, sku_id } = req.body;
  try {
    const cart = increaseQuantityService(userId, sku_id);

    res
      .status(StatusCodes.OK)
      .json({ message: messagesSuccess.UPDATE_CART_SUCCESS, res: cart });
  } catch (error) {
    next(error);
  }
};

// Decrease quantity = remove one product quantity
const decreaseQuantity: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.userId Param userId input
   * @param {string} req.body.sku_id Param sku_id input
   */
  const { userId, sku_id } = req.body;
  try {
    const cart = await decreaseQuantityService(userId, sku_id);

    res
      .status(StatusCodes.OK)
      .json({ message: messagesSuccess.UPDATE_CART_SUCCESS, res: cart });
  } catch (error) {
    next(error);
  }
};

// Check out cart to orders
// const checkoutOrder: RequestHandler = async (req, res, next) => {
//   const { userId, cartId, shippingAddress, shippingMethod } = req.body;
//   try {
//     // 1. Find cart from user
//     const cart = await Cart.findOne({ userId }).populate('products.sku_id');
//     if (!cart || cart.products.length === 0) {
//       throw new AppError(StatusCodes.NOT_FOUND, 'Cart not exist');
//     }

//     // 2. Check inventory and counting total
//     const subtotal = countTotal(cart.products);

//     // 3. Counting shipping fee
//     let shippingInfo = null;
//     const shippingFee = 50;
//     const total = subtotal + shippingFee;
//     if (shippingMethod === 'shipped') {
//       shippingInfo = await createDeliveryOrder(req, res, next);
//     }

//     // 4. Payment

//     // 5. Create order
//     const order = await Order.create({});

//     if (!order) {
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json({ message: messagesError.BAD_REQUEST });
//     }
//     // 6. Delete cart when create order
//     await Cart.findByIdAndDelete(userId);

//     // 7. Send verify email order
//     res.status(StatusCodes.CREATED).json({
//       message: messagesSuccess.CREATE_ORDER_SUCCESS,
//       res: order,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export {
  AddToCart,
  // checkoutOrder,
  createCart,
  decreaseQuantity,
  GetById,
  GetCart,
  increaseQuantity,
  RemoveCart,
  RemoveFromCart,
};
