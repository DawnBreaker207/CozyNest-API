import Cart from '@/models/Cart';
import Order from '@/models/Order';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { messagesError, messagesSuccess } from '../constants/messages';
import { ProductCart } from '../interfaces/Cart';
import { Product } from '../models/Product';
import { AppError } from '@/utils/errorHandle';
import { Sku } from '@/models/Sku';
import { Variant } from '@/models/Variant';
import { OptionalValueType } from '@/interfaces/Variant';
import { countTotal, findFromCart, removeFromCart } from '@/utils/variants';

// Create cart
const createCart: RequestHandler = async (req, res, next) => {
  try {
    const newCart = await Cart.create({ ...req.body, isGuest: true });
    newCart.totalPrice = countTotal(newCart.products);

    await newCart.save();

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
  const { userId } = req.params;
  try {
    const cart = await Cart.findOne({ userId }).populate('products.sku_id');
    if (!cart) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Cart not found');
    }
    cart.totalPrice = countTotal(cart?.products);

    await cart?.save();

    const new_cart = cart?.toObject();

    const SKUs = await Promise.all(
      cart.products.map(async (item) => {
        // Find SKU exist
        const SKUData = await Sku.findById(String(item.sku_id)).select(
          'name shared_url product_id slug image -_id'
        );
        // Take variant of sku
        const variants = await Variant.find({
          sku_id: item.sku_id,
        }).populate(['optional_value_id']);

        const optionValue = variants.map((option) => {
          const optionalValue =
            option.option_value_id as unknown as OptionalValueType;
          return optionalValue.label;
        });

        return { ...item.toObject(), SKUData, optionValue };
      })
    );

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
  const { userId } = req.params;
  try {
    const cart = await Cart.findOne({ userId }).populate('products.sku_id');
    if (!cart) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Cart not found');
    }
    const cartData = {
      cartId: cart?._id.toString(),
      products: cart?.products.map((item) => ({
        sku_id: item.sku_id,
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice: cart.totalPrice,
    };

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
  const { userId, guestId, sku_id, quantity } = req.body;
  try {
    // Check if cart exist by userId
    let cart = await Cart.findOne({ $or: [{ userId }, { guestId }] }).select(
      '-deleted_at -deleted -created_at -updated_at -createdAt -__v'
    );

    // If cart not exist create new one
    if (!cart) {
      cart = new Cart({ userId, guestId, products: [] });
    }

    // Check product exist in database
    const product = await Product.findById(sku_id);
    // If not found return error
    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

    // Find product exist in cart
    const existProductIndex = cart.products.findIndex(
      (item) => item.sku_id.toString() === sku_id
    );
    // Check product exist in cart
    if (existProductIndex !== -1) {
      // If exist update quantity
      cart.products[existProductIndex].quantity += quantity;
    } else {
      // If not create new
      cart.products.push({
        sku_id,
        quantity: quantity,
        price: product.price,
      });
    }

    // Count price in cart
    cart.totalPrice = countTotal(cart.products);

    // Check if user info have
    if (userId) {
      cart.userId = userId;
      cart.guestId = '';
    }

    // Save cart
    await cart.save();

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
  const { userId, sku_id } = req.body;
  try {
    //Find cart exist
    const cart = await Cart.findOne({ userId });
    // If not found
    if (!cart) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Cart not found');
    }

    // If found, filter cart
    cart.products = removeFromCart(cart, sku_id);
    // cart.products = cart.products.filter((product) => {
    //   return product.sku_id && product.sku_id.toString() !== sku_id;
    // }) as Types.DocumentArray<ProductCart>;
    await cart.save();

    return res
      .status(StatusCodes.CREATED)
      .json({ message: messagesSuccess.REMOVE_CART_ITEMS_SUCCESS, res: cart });
  } catch (error) {
    next(error);
  }
};

// Remove cart = delete cart
const RemoveCart: RequestHandler = async (req, res, next) => {
  try {
    const data = await Cart.findByIdAndDelete({
      cart_id: req.params.id,
    }).select('-deleted_at -deleted -__v');
    // If not find id product in cart
    if (!data) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Cart not found');
    }

    res.status(StatusCodes.NO_CONTENT).json({
      message: messagesSuccess.REMOVE_CART_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

// Increase quantity = add one product quantity
const increaseQuantity: RequestHandler = async (req, res, next) => {
  const { userId, sku_id } = req.body;
  try {
    // Check cart exist
    const cart = await Cart.findOne({ userId });
    // If not exist
    if (!cart) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Cart not found');
    }

    // Find product exist in cart
    const product = findFromCart(cart, sku_id);
    // const product = cart?.products.find(
    //   (item) => item.sku_id.toString() === sku_id
    // ) as ProductCart;
    // If not exist
    if (!product) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: StatusCodes.NOT_FOUND });
    }
    // If exist update quantity
    product.quantity++;
    // Update total price
    cart.totalPrice += product.price;

    await cart?.save();

    return res
      .status(StatusCodes.OK)
      .json({ message: messagesSuccess.UPDATE_CART_SUCCESS, res: cart });
  } catch (error) {
    next(error);
  }
};

// Decrease quantity = remove one product quantity
const decreaseQuantity: RequestHandler = async (req, res, next) => {
  const { userId, sku_id } = req.body;
  try {
    // Check cart exist
    const cart = await Cart.findOne({ userId });
    // If not exist
    if (!cart) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Cart not found');
    }
    // Find product exist in cart
    const product = findFromCart(cart, sku_id);
    // const product = cart?.products.find(
    //   (item) => item.sku_id.toString() === sku_id
    // ) as ProductCart;
    // If not exist

    // If not exist
    if (!product) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: StatusCodes.NOT_FOUND });
    }
    // If exist update quantity
    if (product.quantity > 1) {
      product.quantity--;
      // Update total price
      cart.totalPrice -= product.price;
    } else {
      // Remove product if quantity is 1
      cart.products = removeFromCart(cart, sku_id);
      // cart.products = cart.products.filter((product) => {
      //   return product.sku_id && product.sku_id.toString() !== sku_id;
      // }) as Types.DocumentArray<ProductCart>;
    }
    await cart?.save();

    return res
      .status(StatusCodes.OK)
      .json({ message: messagesSuccess.UPDATE_CART_SUCCESS, res: cart });
  } catch (error) {
    next(error);
  }
};

// Check out cart to orders
const checkoutOrder: RequestHandler = async (req, res, next) => {
  const { userId } = req.body;
  try {
    const cart = await Cart.findOne({ userId }).populate('products.productId');
    if (!cart) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: messagesError.NOT_FOUND });
    }

    const subtotal = cart.products.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
    const shippingFee = 50;

    const total = subtotal + shippingFee;

    const order = await Order.create({});

    if (!order) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.BAD_REQUEST });
    }

    await Cart.findByIdAndDelete(userId);

    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.CREATE_ORDER_SUCCESS,
      res: order,
    });
  } catch (error) {
    next(error);
  }
};

export {
  AddToCart,
  checkoutOrder,
  decreaseQuantity,
  GetCart,
  increaseQuantity,
  RemoveCart,
  RemoveFromCart,
  createCart,
  GetById,
};
