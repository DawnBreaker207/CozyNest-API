// import Cart from '@/models/Cart';
// import { RequestHandler } from 'express';
// import { StatusCodes } from 'http-status-codes';
// import { Types } from 'mongoose';
// import { messagesError, messagesSuccess } from '../constants/messages';
// import { ProductCart } from '../interfaces/Cart';
// import { Product } from '../models/Product';

// const GetById: RequestHandler = async (req, res, next) => {
//   const { userId } = req.params;
//   try {
//     const cart = await Cart.findOne({ userId }).populate('products.productId');
//     const cartData = {
//       cartId: cart?.id,
//       products: cart?.products.map((item) => ({
//         productId: item.productId,
//         quantity: item.quantity,
//         price: item.price,
//       })),
//     };

//     return res.status(StatusCodes.OK).json({
//       message: messagesSuccess.GET_CART_SUCCESS,
//       res: cartData,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// const AddToCart: RequestHandler = async (req, res, next) => {
//   const { userId, productId, quantity } = req.body;
//   try {
//     // Check if cart exist by userId
//     let cart = await Cart.findOne({ userId });

//     // If cart not exist create new one
//     if (!cart) {
//       cart = new Cart({ userId, products: [] });
//     }

//     // Check product price by find product with Id
//     const productPrice = await Product.findById(productId);
//     // If not found return error
//     if (!productPrice) {
//       return res.status(StatusCodes.NOT_FOUND).json({
//         message: messagesError.NOT_FOUND,
//       });
//     }

//     // Find product exist in cart
//     const existProductIndex = cart.products.findIndex(
//       (item) => item.productId.toString() === productId
//     );
//     // Check product exist in cart
//     if (existProductIndex !== -1) {
//       // If exist update quantity
//       cart.products[existProductIndex].quantity += quantity;
//     } else {
//       // If not create new
//       cart.products.push({
//         productId,
//         quantity: quantity,
//         price: productPrice.base_price,
//       });
//     }

//     // Save cart
//     await cart.save();

//     return res.status(StatusCodes.OK).json({
//       message: messagesSuccess.ADD_CART_SUCCESS,
//       res: cart,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// const RemoveFromCart: RequestHandler = async (req, res, next) => {
//   const { userId, productId } = req.body;
//   try {
//     //Find cart exist
//     const cart = await Cart.findOne({ userId });
//     // If not found
//     if (!cart) {
//       return res
//         .status(StatusCodes.NOT_FOUND)
//         .json({ message: messagesError.NOT_FOUND });
//     }

//     // If found, filter cart
//     cart.products = cart.products.filter((product) => {
//       return product.productId && product.productId.toString() !== productId;
//     }) as Types.DocumentArray<ProductCart>;
//     await cart.save();

//     return res
//       .status(StatusCodes.CREATED)
//       .json({ message: messagesSuccess.REMOVE_CART_ITEMS_SUCCESS, res: cart });
//   } catch (error) {
//     next(error);
//   }
// };
// const RemoveCart: RequestHandler = async (req, res, next) => {
//   try {
//     const data = await Cart.findByIdAndDelete(req.params.id);
//     // If not find id product in cart
//     if (!data) {
//       return res.status(StatusCodes.NOT_FOUND).json({
//         message: messagesError.NOT_FOUND,
//       });
//     }
//     res.status(StatusCodes.NO_CONTENT).json({
//       message: messagesSuccess.REMOVE_CART_SUCCESS,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// const UpdateCart: RequestHandler = async (req, res, next) => {
//   const { userId, productId, quantity } = req.body;
//   try {
//     // Find cart user
//     const cart = await Cart.findOne({ userId });

//     // if not found
//     if (!cart) {
//       return res
//         .status(StatusCodes.NOT_FOUND)
//         .json({ message: messagesError.NOT_FOUND });
//     }

//     // Find product in cart
//     const product = cart.products.find(
//       (item) => item.productId.toString() === productId
//     );

//     // If product not exist in cart
//     if (!product) {
//       return res.status(StatusCodes.NOT_FOUND);
//     }

//     // Update quantity
//     product.quantity = quantity;
//     await cart.save();
//     return res.status(StatusCodes.OK).json({
//       message: messagesSuccess.UPDATE_CART_SUCCESS,
//       res: cart,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// const increaseQuantity: RequestHandler = async (req, res, next) => {
//   const { userId, productId } = req.body;
//   try {
//     // Check cart exist
//     const cart = await Cart.findOne({ userId });
//     // If not exist
//     if (!cart) {
//       res.status(StatusCodes.NOT_FOUND);
//     }
//     // Find product exist in cart
//     const product = cart?.products.find(
//       (item) => item.productId.toString() === productId
//     ) as ProductCart;

//     // If not exist
//     if (!product) {
//       res
//         .status(StatusCodes.NOT_FOUND)
//         .json({ message: StatusCodes.NOT_FOUND });
//     }
//     // If exist update quantity
//     product.quantity++;
//     await cart?.save();

//     return res
//       .status(StatusCodes.OK)
//       .json({ message: messagesSuccess.UPDATE_CART_SUCCESS, res: cart });
//   } catch (error) {
//     next(error);
//   }
// };
// const decreaseQuantity: RequestHandler = async (req, res, next) => {
//   const { userId, productId } = req.body;
//   try {
//     // Check cart exist
//     const cart = await Cart.findOne({ userId });
//     // If not exist
//     if (!cart) {
//       res.status(StatusCodes.NOT_FOUND);
//     }
//     // Find product exist in cart
//     const product = cart?.products.find(
//       (item) => item.productId.toString() === productId
//     ) as ProductCart;

//     // If not exist
//     if (!product) {
//       res
//         .status(StatusCodes.NOT_FOUND)
//         .json({ message: StatusCodes.NOT_FOUND });
//     }
//     // If exist update quantity
//     if (product.quantity > 1) {
//       product.quantity--;
//     }
//     await cart?.save();

//     return res
//       .status(StatusCodes.OK)
//       .json({ message: messagesSuccess.UPDATE_CART_SUCCESS, res: cart });
//   } catch (error) {
//     next(error);
//   }
// };
// // const checkoutOrder: RequestHandler = async (req, res, next) => {
// //   const { userId } = req.body;
// //   try {
// //     const cart = await Cart.findOne({ userId }).populate('products.productId');
// //     if (!cart) {
// //       return res
// //         .status(StatusCodes.NOT_FOUND)
// //         .json({ message: messagesError.NOT_FOUND });
// //     }

// //     const subtotal = cart.products.reduce((total, item) => {
// //       return total + item.price * item.quantity;
// //     }, 0);
// //     const shippingFee = 50;

// //     const total = subtotal + shippingFee;

// //     const order = await Order.create({});

// //     if (!order) {
// //       return res
// //         .status(StatusCodes.BAD_REQUEST)
// //         .json({ message: messagesError.BAD_REQUEST });
// //     }

// //     await Cart.findByIdAndDelete(userId);

// //     res.status(StatusCodes.CREATED).json({
// //       message: messagesSuccess.CREATE_ORDER_SUCCESS,
// //       res: order,
// //     });
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// export {
//   AddToCart,
//   decreaseQuantity,
//   GetById,
//   increaseQuantity,
//   RemoveCart,
//   RemoveFromCart,
//   UpdateCart
// };

