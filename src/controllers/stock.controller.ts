import { Product } from "@/models/Product";
import logger from "@/utils/logger";
import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

export const checkStockBeforePayment: RequestHandler = async (req, res, next) => {
  const { cartItems } = req.body;

  try {
    const stockCheckResults = await Promise.all(cartItems.map(async (item: { productId: any; skuId: string; quantity: number; }) => {
      const product = await Product.findById(item.productId).populate({
        path: 'variants',
        populate: [
          {
            path: 'sku_id',
            model: 'SKU',
            select: 'stock price',
          },
          {
            path: 'option_value_id',
            model: 'Option_Value',
            select: 'value',
          },
        ],
      });

      if (!product) {
        return {
          skuId: item.skuId,
          message: `Sản phẩm với ID ${item.productId} không tồn tại.`,
        };
      }

      const variant = product?.variants?.find((v: { sku_id: { _id: { toString: () => string; }; }; }) => 
        v?.sku_id?._id?.toString().trim() === item.skuId?.trim()
      );

      if (!variant) {
        return {
          skuId: item.skuId,
          message: `Variant với SKU ${item.skuId} không tồn tại trong sản phẩm ${product.name}.`,
        };
      }

      if (variant.sku_id?.stock < item.quantity) {
        return {
          skuId: item.skuId,
          productName: product.name,
          color: variant.option_value_id?.value || 'Không xác định',
          quantity: item.quantity,
          stock: variant.sku_id.stock,
          priceStock: variant.sku_id.price * variant.sku_id.stock,
          priceCart: variant.sku_id.price * item.quantity,
          message: `Sản phẩm ${product.name} vượt quá số lượng tồn kho. Tồn kho: ${variant.sku_id?.stock}, Số lượng trong giỏ hàng: ${item.quantity}`,
        };
      }

      return null;
    }));

    const outOfStockItems = stockCheckResults.filter(item => item && item.message);
    if (outOfStockItems.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        res: outOfStockItems,
      });
    }

    return res.status(StatusCodes.OK).json({
      res: { status: 'success', message: 'Tất cả sản phẩm đủ tồn kho' },
    });
  } catch (error: any) {
    logger.log('error', `Catch error in checkStockBeforePayment: ${error.message}`, {
      stack: error.stack,
      cartItems: req.body.cartItems,
    });
    next(error);
  }
};
