import { CartType, ProductCart } from '@/interfaces/Cart';
import Cart from '@/models/Cart';
import { Product } from '@/models/Product';
import { Sku } from '@/models/Sku';
import { Variant } from '@/models/Variant';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

//* Cart

// Count total price
const countTotal = (arr: { price: number; quantity: number }[]) =>
  arr.reduce(
    (sum, { price, quantity }) => sum + (price || 0) * (quantity || 0),
    0,
  );
// Find product
const findProduct = <T extends { sku_id: Types.ObjectId | string }>(
  products: T[],
  sku_id: Types.ObjectId | string,
): T | undefined =>
  products.find((product) => product.sku_id.toString() === sku_id.toString());
// Remove product in cart
const removeFromCart = (cart: { products: ProductCart[] }, sku_id: string) =>
  cart.products.filter(
    (product) => product.sku_id && product.sku_id.toString() !== sku_id,
  ) as Types.DocumentArray<ProductCart>;

const createCartService = async (input: CartType) => {
  const newCart = await Cart.create({ ...input, isGuest: true });
  newCart.totalPrice = countTotal(newCart.products);

  await newCart.save();
  return newCart;
};

const GetCartService = async (cart_id: string) => {
  const cart = await Cart.findOne({ cart_id }).populate({
    path: 'products.sku_id',
    select: 'product_id',
    populate: [
      {
        path: 'product_id',
        select: 'name thumbnail images',
      },
      {
        path: 'variants',
        populate: [
          {
            path: 'option_value_id',
            populate: {
              path: 'option_id',
              select: 'name',
            },
          },
        ],
      },
    ],
  });
  if (!cart) {
    logger.log('error', 'Cart is not found in get cart');
    throw new AppError(StatusCodes.NOT_FOUND, 'Cart not found');
  }
  cart.totalPrice = countTotal(cart?.products);

  await cart?.save();

  const new_cart = cart?.toObject(),
    SKUs = await Promise.all(
      cart.products.map(async (item) => {
        // Find SKU exist
        const SKUData = await Sku.findById(String(item.sku_id)).select(
          'name shared_url product_id slug image -_id',
        );
        // Take variant of sku
        const variants = await Variant.find({
          sku_id: item.sku_id,
        }).populate('option_values');

        const optionValue = variants.map(
          (option) => option?.toObject()?.option_value_id?.label,
        );

        return {
          ...item,
          SKUData,
          optionValue,
        };
      }),
    );
  return { SKUs, new_cart };
};
const GetByIdService = async (userId: string) => {
  const cart = await Cart.findOne({ user_id: userId }).populate({
    path: 'products.sku_id',
    populate: [
      {
        path: 'product_id',
        select: 'name images',
        populate: {
          path: 'variants',
          populate: {
            path: 'option_value_id',
            populate: {
              path: 'option_id',
              select: 'name',
            },
          },
        },
      },
    ],
  });
  if (!cart) {
    logger.log('error', 'Cart is not found in get cart by id');
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
  return cartData;
};
const AddToCartService = async (
  userId: string,
  guestId: string,
  sku_id: string,
  quantity: number,
) => {
  // Check if cart exist by userId
  let cart = await Cart.findOne({ $or: [{ userId }, { guestId }] }).select(
    '-deleted_at -deleted -created_at -updated_at -createdAt -__v',
  );

  // If cart not exist create new one
  if (!cart) {
    cart = new Cart({ userId, guestId, products: [] });
  }

  // Check variant exist in database
  const variant = await Variant.findOne({ sku_id });
  if (!variant) {
    logger.log('error', 'Variant is not exist in add to cart');
    throw new AppError(StatusCodes.NOT_FOUND, 'Variant not exist');
  }

  const sku = await Sku.findById(variant.sku_id).lean();
  if (!sku) {
    logger.log('error', 'SKU is not found in add to cart');
    throw new AppError(StatusCodes.NOT_FOUND, 'SKU not found');
  }

  // Find product match with product id in variant
  const product = await Product.findById(variant.product_id);
  if (!product) {
    logger.log('error', 'Product is not found in add to cart');
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  // Find product exist in cart
  const existProductIndex = cart.products.findIndex(
    (item) => item.sku_id.toString() === sku_id,
  );

  // Check product exist in cart, if exist update quantity
  if (existProductIndex !== -1) {
    cart.products[existProductIndex].quantity += quantity;
  } else {
    // If not create new
    cart.products.push({
      sku_id: sku._id,
      price: sku.price,
      quantity,
    });
  }

  // Count price in cart
  cart.totalPrice = countTotal(cart.products);

  // Check if user info have
  if (userId) {
    cart.user_id = userId as unknown as Types.ObjectId;
  }

  // Save cart
  await cart.save();
  return cart;
};

const RemoveFromCartService = async (userId: string, sku_id: string) => {
  //Find cart exist
  const cart = await Cart.findOne({ userId });
  // If not found
  if (!cart) {
    logger.log('error', 'Cart is not found in remove from cart');
    throw new AppError(StatusCodes.NOT_FOUND, 'Cart not found');
  }

  cart.products = removeFromCart(cart, sku_id);
  cart.totalPrice = countTotal(cart.products);
  // Cart.products = cart.products.filter((product) => {
  //   Return product.sku_id && product.sku_id.toString() !== sku_id;
  // }) as Types.DocumentArray<ProductCart>;

  await cart.save();
  return cart;
};

const RemoveCartService = async (id: string) => {
  const data = await Cart.findByIdAndDelete({
    _id: id,
  }).select('-deleted_at -deleted -__v');
  // If not find id product in cart
  if (!data) {
    logger.log('error', 'Cart is not found in remove from cart');
    throw new AppError(StatusCodes.NOT_FOUND, 'Cart not found');
  }
  return data;
};
const increaseQuantityService = async (userId: string, sku_id: string) => {
  // Check cart exist
  const cart = await Cart.findOne({ userId });
  // If not exist
  if (!cart) {
    logger.log('error', 'Cart is not exist in increase quantity');
    throw new AppError(StatusCodes.NOT_FOUND, 'Cart not found');
  }
  // Find product exist in cart
  const product = findProduct<ProductCart>(
    cart.products as ProductCart[],
    sku_id,
  );
  // Const product = cart?.products.find(
  //   (item) => item.sku_id.toString() === sku_id
  // ) as ProductCart;
  // If not exist

  if (!product) {
    logger.log('error', 'Product is not found in increase quantity');
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }
  if (product?.quantity) {
    // If exist update quantity
    product.quantity++;
    // Update total price
    cart.totalPrice += product.price;
  }

  await cart?.save();
  return cart;
};
const decreaseQuantityService = async (userId: string, sku_id: string) => {
  // Check cart exist
  const cart = await Cart.findOne({ userId });
  // If not exist
  if (!cart) {
    logger.log('error', 'Cart is not exist in decrease quantity');
    throw new AppError(StatusCodes.NOT_FOUND, 'Cart not found');
  }
  // Find product exist in cart
  const product = findProduct(cart.products as ProductCart[], sku_id);
  // Const product = cart?.products.find(
  //   (item) => item.sku_id.toString() === sku_id
  // ) as ProductCart;
  // If not exist

  // If not exist
  if (!product) {
    logger.log('error', 'Product is not exist in decrease quantity');
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  // If exist update quantity
  if (product?.quantity && product.quantity > 1) {
    product.quantity--;
    // Update total price
    cart.totalPrice -= product.price;
  } else {
    // Remove product if quantity is 1
    cart.products = removeFromCart(cart, sku_id);
    // Cart.products = cart.products.filter((product) => {
    //   Return product.sku_id && product.sku_id.toString() !== sku_id;
    // }) as Types.DocumentArray<ProductCart>;
  }
  await cart?.save();
  return cart;
};

export {
  AddToCartService,
  countTotal,
  createCartService,
  decreaseQuantityService,
  findProduct,
  GetByIdService,
  GetCartService,
  increaseQuantityService,
  RemoveCartService,
  removeFromCart,
  RemoveFromCartService,
};
