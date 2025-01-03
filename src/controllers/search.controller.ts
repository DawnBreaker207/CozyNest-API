import Article from '@/models/Article';
import { Product } from '@/models/Product';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

// Tìm kiếm sản phẩm theo từ khóa
export const searchProducts: RequestHandler = async (req, res, next) => {
  console.log('Tìm kiếm với từ khóa:', req.query.query);
  const { query } = req.query; // Nhận từ khóa tìm kiếm từ query string

  if (
    !query ||
    (Array.isArray(query) &&
      query.some(
        (item) => typeof item === 'string' && item.trim().length === 0,
      ))
  ) {
    logger.log('error', 'Từ khóa tìm kiếm không hợp lệ');
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Từ khóa tìm kiếm không hợp lệ',
    );
  }

  try {
    // Tìm kiếm sản phẩm với tên hoặc mô tả chứa từ khóa
    const products = await Product.find({
      is_hidden: false,
      $or: [
        { name: { $regex: query, $options: 'i' } }, // 'i' là option không phân biệt chữ hoa chữ thường
        { description: { $regex: query, $options: 'i' } },
      ],
    }).populate([
      {
        path: 'variants',
        select: 'sku_id',
        populate: [
          {
            path: 'sku_id',
            select: 'image name SKU price stock sold price_discount_percent',
          },
          { path: 'option_id', select: 'name position' },
          {
            path: 'option_value_id',
            select: 'label value',
          },
        ],
      },
    ]);

    if (products.length === 0) {
      logger.log('error', 'Không tìm thấy sản phẩm');
      throw new AppError(StatusCodes.BAD_REQUEST, 'Không tìm thấy sản phẩm');
    }

    res.status(StatusCodes.OK).json(products);
  } catch (error) {
    logger.log('error', `Catch error in search products: ${error} `);
    next(error);
  }
};

export const searchArticles: RequestHandler = async (req, res, next) => {
  const { query } = req.query;
  try {
    const searchQuery = typeof query === 'string' ? query : '';
    const articles = await Article.find({
      title: { $regex: searchQuery, $options: 'i' },
    }).select('title content author');
    res.status(StatusCodes.OK).json(articles);
  } catch (error) {
    logger.log('error', `Catch error in search articles: ${error} `);
    next(error);
  }
};
