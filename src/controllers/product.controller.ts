import { messagesSuccess } from '@/constants/messages';
import {
  createProductService,
  deleteProductService,
  findRelatedProductService,
  getAllProductsService,
  getOneProductService,
  hideProductService,
  updateProductService,
} from '@/services/product.service';
import logger from '@/utils/logger';
import { RequestHandler } from 'express';
import { Server } from 'http';
import { StatusCodes } from 'http-status-codes';
//* Products

export const getAllProducts: RequestHandler = async (req, res, next) => {
  /**
   * @param {number} req.query._page Param _page input
   * @param {string} req.query._order Param _order input
   * @param {number} req.query._limit Param _limit input
   * @param {string} req.query._sort Param _sort input
   * @param {string} req.query.categoryId Param categoryId input
   * @param {string} req.query.originId Param originId input
   * @param {string} req.query.minPrice Param minPrice input
   * @param {string} req.query.maxPrice Param maxPrice input
   */
  const {
    _page = 1,
    _order = 'desc',
    _limit = 9999,
    _sort = 'createdAt',
    _q = '',
    _category_id = '',
    _minPrice = '',
    _maxPrice = '',
  } = req.query;

  try {
    const page = typeof _page === 'string' ? parseInt(_page, 10) : 1,
      limit = typeof _limit === 'string' ? parseInt(_limit, 10) : 9999,
      sortField = typeof _sort === 'string' ? _sort : 'createAt',
      options = {
        page,
        limit,
        sort: {
          [sortField]: _order === 'desc' ? -1 : 1,
        },

        populate: [
          { path: 'category_id', select: 'name isHidden' },
          {
            path: 'variants',
            select: 'sku_id',
            populate: [
              {
                path: 'sku_id',
                select:
                  'name price SKU image sold stock price_discount_percent price_before_discount',
              },
              { path: 'option_id', select: 'name position' },
              {
                path: 'option_value_id',
                select: 'label value',
              },
            ],
          },
        ],
      },
      query: any = {};

    if (_q) {
      query.name = { $regex: _q, $options: 'i' };
    }

    if (_category_id && typeof _category_id === 'string') {
      query.categoryId = _category_id;
    }
    if (_minPrice && typeof _minPrice === 'string') {
      query.price = { ...query.price, $gte: parseFloat(_minPrice) };
    }
    if (_maxPrice && typeof _maxPrice === 'string') {
      query.price = { ...query.price, $lte: parseFloat(_maxPrice) };
    }
    const products = await getAllProductsService(query, options);

    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.GET_PRODUCT_SUCCESS,
      res: products.docs,
      pagination: {
        currentPage: products.page,
        totalPages: products.totalPages,
        totalItems: products.totalDocs,
        maxPrice: products.maxPrice,
        minPrice: products.minPrice,
      },
    });
  } catch (error) {
    logger.log('error', `Catch error in get all products: ${error}`);
    next(error);
  }
};

export const getOneProduct: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id
   */
  const { id } = req.params;
  try {
    const data = await getOneProductService(id);

    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.GET_PRODUCT_SUCCESS,
      res: data,
    });
  } catch (error) {
    logger.log('error', `Catch error in get one product: ${error}`);
    next(error);
  }
};

export const createProduct: RequestHandler = async (req, res, next) => {
  /**
   * @param {ProductType} req.body Param body input
   */
  try {
    const product = await createProductService(req.body);
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CREATE_PRODUCT_SUCCESS,
      res: product,
    });
  } catch (error) {
    logger.log('error', `Catch error in create product: ${error}`);
    next(error);
  }
};

export const updateProduct: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   * @param {ProductType} req.body Param body input
   */
  const { id } = req.params;

  try {
    const data = await updateProductService(id, req.body);

    // Lấy instance của server Socket.IO (nếu bạn có sẵn io instance ở đâu đó, ví dụ trong app.js hoặc server.ts)
    const io: Server = req.app.get('io'); // Hoặc bạn có thể truyền io vào controller qua middleware nếu cần

    // Phát sự kiện cập nhật sản phẩm tới tất cả các client trong room "product_{id}"
    io.emit('productUpdated', { productId: id, updatedData: data }); // Phát sự kiện đến tất cả client

    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.UPDATE_PRODUCT_SUCCESS,
      res: data,
    });
  } catch (error) {
    logger.log('error', `Catch error in update product: ${error}`);
    next(error);
  }
};

export const softDeleteProduct: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   */
  const { id } = req.params;
  try {
    // Find product exist and hidden
    const data = await hideProductService(id);
    // Lấy instance của server Socket.IO (nếu bạn có sẵn io instance ở đâu đó, ví dụ trong app.js hoặc server.ts)
    const io: Server = req.app.get('io'); // Hoặc bạn có thể truyền io vào controller qua middleware nếu cần

    // Phát sự kiện cập nhật sản phẩm tới tất cả các client trong room "product_{id}"
    io.emit('productUpdated', { productId: id, updatedData: data }); // Phát sự kiện đến tất cả client
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_PRODUCT_SUCCESS,
      res: data,
    });
  } catch (error) {
    logger.log('error', `Catch error in hide product: ${error}`);
    next(error);
  }
};

export const hardDeleteProduct: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   */
  const { id } = req.params;
  try {
    await deleteProductService(id);
    res.status(StatusCodes.NO_CONTENT);
  } catch (error) {
    logger.log('error', `Catch error in delete product: ${error}`);
    next(error);
  }
};

export const getRelatedProducts: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} cate_id Param cate_id input
   * @param {string} product_id Param product_id input
   */
  const { cate_id, product_id } = req.params;
  try {
    const populatedProducts = await findRelatedProductService(
      cate_id,
      product_id,
    );
    res.status(StatusCodes.OK).json({
      res: populatedProducts,
    });
  } catch (error) {
    logger.log('error', `Catch error in get related products: ${error}`);
    next(error);
  }
};
