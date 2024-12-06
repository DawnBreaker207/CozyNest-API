import {
  AddToCartService,
  GetByIdService,
  GetCartService,
  RemoveCartService,
  RemoveFromCartService,
  createCartService,
  decreaseQuantityService,
  increaseQuantityService,
  removeAllFromCartService,
} from '@/services/cart.service';
import logger from '@/utils/logger';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { messagesSuccess } from '../constants/messages';

// Create cart
export const createCart: RequestHandler = async (req, res, next) => {
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
    logger.log('error', `Catch error in create cart: ${error}`);
    next(error);
  }
};

// Get cart by user id
export const GetCart: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.userId Param userId input
   */
  const { userId } = req.params;
  try {
    const { SKUs, new_cart } = await GetCartService(userId);

    // Const cartData = {
    //   CartId: cart?.id,
    //   Products: cart?.products.map((item) => ({
    //     ProductId: item.productId,
    //     Quantity: item.quantity,
    //     Price: item.price,
    //   })),
    // };

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_CART_SUCCESS,
      // Res: cartData,
      res: { ...new_cart, products: SKUs },
    });
  } catch (error) {
    logger.log('error', `Catch error in get cart: ${error}`);
    next(error);
  }
};

// Get cart by user id
export const GetCartById: RequestHandler = async (req, res, next) => {
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
    logger.log('error', `Catch error in get cart by id: ${error}`);
    next(error);
  }
};

// Add product to cart = create cart
export const AddToCart: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.userId Param userId input
   * @param {string} req.body.guestId Param guestId input
   * @param {string} req.body.sku_id Param sku_id input
   * @param {number} req.body.quantity Param quantity input
   */
  const { userId, guestId, sku_id, quantity } = req.body;
  try {
    const cart = await AddToCartService(userId, guestId, sku_id, quantity);

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.ADD_CART_SUCCESS,
      res: cart,
    });
  } catch (error) {
    logger.log('error', `Catch error in add to cart: ${error}`);
    next(error);
  }
};

// Remove all product from cart = delete product
export const removeAllFromCart: RequestHandler = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const cart = await removeAllFromCartService(userId);

    return res.status(StatusCodes.OK).json({
      message: 'All products have been removed from the cart.',
      res: cart,
    });
  } catch (error) {
    logger.log('error', `Catch error in remove all from cart: ${error}`);
    next(error);
  }
};
// Remove product from cart = delete product
export const RemoveFromCart: RequestHandler = async (req, res, next) => {
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
    logger.log('error', `Catch error in remove from cart: ${error}`);
    next(error);
  }
};

// Remove cart = delete cart
export const RemoveCart: RequestHandler = async (req, res, next) => {
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
    logger.log('error', `Catch error in remove cart: ${error}`);
    next(error);
  }
};

// Increase quantity = add one product quantity
export const increaseQuantity: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.userId Param userId input
   * @param {string} req.body.sku_id Param sku_id input
   */
  const { userId, sku_id } = req.body;
  try {
    const cart = await increaseQuantityService(userId, sku_id);

    res
      .status(StatusCodes.OK)
      .json({ message: messagesSuccess.UPDATE_CART_SUCCESS, res: cart });
  } catch (error) {
    logger.log('error', `Catch error in increase quantity: ${error}`);
    next(error);
  }
};

// Decrease quantity = remove one product quantity
export const decreaseQuantity: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.userId Param userId input
   * @param {string} req.body.sku_id Param sku_id input
   * @param {string} req.body.quantity Param sku_id input
   */
  const { userId, sku_id,quantity } = req.body;
  try {
    const cart = await decreaseQuantityService(userId, sku_id, quantity);

    res
      .status(StatusCodes.OK)
      .json({ message: messagesSuccess.UPDATE_CART_SUCCESS, res: cart });
  } catch (error) {
    logger.log('error', `Catch error in decrease quantity: ${error}`);
    next(error);
  }
};

// Check out cart to orders
// Const checkoutOrder: RequestHandler = async (req, res, next) => {
//   Const { userId, cartId, shippingAddress, shippingMethod } = req.body;
//   Try {
//     // 1. Find cart from user
//     Const cart = await Cart.findOne({ userId }).populate('products.sku_id');
//     If (!cart || cart.products.length === 0) {
//       Throw new AppError(StatusCodes.NOT_FOUND, 'Cart not exist');
//     }

//     // 2. Check inventory and counting total
//     Const subtotal = countTotal(cart.products);

//     // 3. Counting shipping fee
//     Let shippingInfo = null;
//     Const shippingFee = 50;
//     Const total = subtotal + shippingFee;
//     If (shippingMethod === 'shipped') {
//       ShippingInfo = await createDeliveryOrder(req, res, next);
//     }

//     // 4. Payment

//     // 5. Create order
//     Const order = await Order.create({});

//     If (!order) {
//       Return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json({ message: messagesError.BAD_REQUEST });
//     }
//     // 6. Delete cart when create order
//     Await Cart.findByIdAndDelete(userId);

//     // 7. Send verify email order
//     Res.status(StatusCodes.CREATED).json({
//       Message: messagesSuccess.CREATE_ORDER_SUCCESS,
//       Res: order,
//     });
//   } catch (error) {
//     Next(error);
//   }
// };
