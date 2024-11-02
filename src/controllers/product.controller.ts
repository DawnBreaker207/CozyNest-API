import { messagesSuccess } from '@/constants/messages';
import {
  createProductService,
  findRelatedProductService,
  getAllService,
  getOneProductService,
  deleteProductService,
  hideProductService,
  updateProductService,
} from '@/services/product.service';
import logger from '@/utils/logger';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

//* Products

const Get_All_Product: RequestHandler = async (req, res, next) => {
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
    _categoryId = '',
    _originId = '',
    _minPrice = '',
    _maxPrice = '',
  } = req.query;

  try {
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
    logger.log('error', `Catch error in get all products: ${error}`);
    next(error);
  }
};

const Get_One_Product: RequestHandler = async (req, res, next) => {
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

const Create_Product: RequestHandler = async (req, res, next) => {
  /**
   * @param {ProductType} req.body Param body input
   */
  try {
    const product = await createProductService(req.body);
    res.status(200).json({
      message: messagesSuccess.CREATE_PRODUCT_SUCCESS,
      res: product,
    });
  } catch (error) {
    logger.log('error', `Catch error in create product: ${error}`);
    next(error);
  }
};

const Update_Product: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   * @param {ProductType} req.body Param body input
   */
  const { id } = req.params;
  try {
    const data = await updateProductService(id, req.body);

    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.UPDATE_PRODUCT_SUCCESS,
      res: data,
    });
  } catch (error) {
    logger.log('error', `Catch error in update product: ${error}`);
    next(error);
  }
};

const Hide_Product: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   */
  const { id } = req.params;
  try {
    // Find product exist and hidden
    const data = await hideProductService(id);
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_PRODUCT_SUCCESS,
      res: data,
    });
  } catch (error) {
    logger.log('error', `Catch error in hide product: ${error}`);
    next(error);
  }
};

const Delete_Product: RequestHandler = async (req, res, next) => {
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

const getRelatedProducts: RequestHandler = async (req, res, next) => {
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

export {
  Create_Product,
  Delete_Product,
  Get_All_Product,
  Get_One_Product,
  getRelatedProducts,
  Hide_Product,
  Update_Product,
};
