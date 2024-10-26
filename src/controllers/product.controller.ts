import { messagesSuccess } from '@/constants/messages';
import {
  createProduct,
  findRelatedProduct,
  getAllService,
  getOneProduct,
  hardDelete,
  softDelete,
  updateProduct,
} from '@/services/product.service';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

//* Products

const Get_All_Product: RequestHandler = async (req, res, next) => {
  /**
   * @param {number} req.query._page
   * @param {string} req.query._order
   * @param {number} req.query._limit
   * @param {string} req.query._sort
   * @param {string} req.query.categoryId
   * @param {string} req.query.originId
   * @param {string} req.query.minPrice
   * @param {string} req.query.maxPrice
   */
  const {
    _page = 1,
    _order = 'desc',
    _limit = 9999,
    _sort = 'createdAt',
    _q = '',
    _categoryId = '',
    _originId = '',
    _minPrice = '',
    _maxPrice = '',
  } = req.query;
  const page = typeof _page === 'string' ? parseInt(_page, 10) : 1;
  const limit = typeof _limit === 'string' ? parseInt(_limit, 10) : 9999;
  const sortField = typeof _sort === 'string' ? _sort : 'createAt';

  const options = {
    page: page,
    limit: limit,
    sort: {
      [sortField]: _order === 'desc' ? -1 : 1,
    },

    populate: [
      { path: 'categoryId', select: 'name' },
      {
        path: 'variants',
        select: 'sku_id option_id option_value_id',
        populate: [
          { path: 'sku_id', select: 'SKU name price stock' },
          { path: 'option_id', select: 'name' },
          { path: 'option_value_id', select: 'value' },
        ],
      },
    ],
  };

  const query: any = {};

  if (_q) {
    query.name = { $regex: _q, $options: 'i' };
  }

  if (_categoryId && typeof _categoryId === 'string') {
    query.categoryId = _categoryId;
  }
  if (_originId && typeof _originId === 'string') {
    const originIds = _originId.split(',').map((id: string) => id.trim());
    query.originId = { $in: originIds };
  }
  if (_minPrice && typeof _minPrice === 'string') {
    query.price = { ...query.price, $gte: parseFloat(_minPrice) };
  }
  if (_maxPrice && typeof _maxPrice === 'string') {
    query.price = { ...query.price, $lte: parseFloat(_maxPrice) };
  }

  try {
    const products = await getAllService(query, options);

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
    next(error);
  }
};

const Get_One_Product: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id
   */
  try {
    const data = await getOneProduct(req.params.id);

    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.GET_PRODUCT_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};

const Create_Product: RequestHandler = async (req, res, next) => {
  /**
   * @param {ProductType} req.body
   */
  try {
    const product = await createProduct(req.body);
    res.status(200).json({
      message: messagesSuccess.CREATE_PRODUCT_SUCCESS,
      res: product,
    });
  } catch (error) {
    next(error);
  }
};

const Update_Product: RequestHandler = async (req, res, next) => {
  try {
    /**
     * @param {string} req.params.id
     */
    const data = await updateProduct(req.params.id, req.body);

    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.UPDATE_PRODUCT_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};

const Hide_Product: RequestHandler = async (req, res, next) => {
  try {
    /**
     * @param {string} req.params.id
     */
    // Find product exist and hidden
    const data = await softDelete(req.params.id);
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_PRODUCT_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};

const Delete_Product: RequestHandler = async (req, res, next) => {
  try {
    /**
     * @param {string} req.params.id
     */

    await hardDelete(req.params.id);
    res.status(StatusCodes.NO_CONTENT);
  } catch (error) {
    next(error);
  }
};

const getRelatedProducts: RequestHandler = async (req, res, next) => {
  try {
    /**
     * @param {string} cate_id
     * @param {string} product_id
     */
    const { cate_id, product_id } = req.params;

    const populatedProducts = await findRelatedProduct(cate_id, product_id);
    res.status(StatusCodes.OK).json({
      res: populatedProducts,
    });
  } catch (error) {
    next(error);
  }
};

export {
  Create_Product,
  Delete_Product,
  Get_All_Product,
  Get_One_Product,
  getRelatedProducts,
  Hide_Product,
  Update_Product
};

