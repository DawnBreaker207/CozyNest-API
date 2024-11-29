import Article from '@/models/Article';
import { Product } from '@/models/Product';
import {  RequestHandler } from 'express';

// Tìm kiếm sản phẩm theo từ khóa
export const searchProducts: RequestHandler = async (req ,res, next) => {
  console.log('Tìm kiếm với từ khóa:', req.query.query);
  const { query } = req.query; // Nhận từ khóa tìm kiếm từ query string

  if (!query || (Array.isArray(query) && query.some(item => typeof item === 'string' && item.trim().length === 0))) {
    return res.status(400).json({ message: 'Từ khóa tìm kiếm không hợp lệ' });
}

  try {
    // Tìm kiếm sản phẩm với tên hoặc mô tả chứa từ khóa
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } }, // 'i' là option không phân biệt chữ hoa chữ thường
        { description: { $regex: query, $options: 'i' } }
      ]
    });

    if (products.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    res.json(products);
  } catch (error) {
    next(error);
    console.error(error);
    res.status(500).json({ message: 'Đã có lỗi xảy ra' });
  }
};

export const searchArticles: RequestHandler = async (req, res, next) => {
  const { query } = req.query;
  try {
    const searchQuery = typeof query === 'string' ? query : '';
    const articles = await Article.find({
      title: { $regex: searchQuery, $options: "i" }
    }).select('title content author');
    res.status(200).json(articles);
  } catch (error) {
    next(error);
    console.error(error);
    res.status(500).json({ message: 'Đã có lỗi xảy ra' });
  }
};
