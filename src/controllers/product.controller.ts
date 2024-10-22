import { messagesError, messagesSuccess } from '@/constants/messages';
import Category from '@/models/Category';
import { Product } from '@/models/Product';
import { AppError } from '@/utils/errorHandle';
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
    populate: ['categoryId', 'variants'],
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
    const products = await Product.paginate(query, options);

    // Check if any product exist
    if (!products || products.docs.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.BAD_REQUEST });
    }
    // Find data with the config
    const data = await Product.find();

    let maxPrice = 0;
    let minPrice = Number.MAX_SAFE_INTEGER;

    // Check data with the min and max price with the discount
    for (const item of data) {
      const price = item.price - (item.price * item.discount) / 100;
      maxPrice = Math.max(maxPrice, price);
      minPrice = Math.min(minPrice, price);
    }

    // If not found of error return error
    if (!data) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.BAD_REQUEST });
    }
    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.GET_PRODUCT_SUCCESS,
      res: products.docs,
      pagination: {
        currentPage: products.page,
        totalPages: products.totalPages,
        totalItems: products.totalDocs,
        maxPrice,
        minPrice,
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
    const data = await Product.findById(req.params.id).populate('variants');

    // If data not exist
    if (!data) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.BAD_REQUEST });
    }

    // Populate to category
    await data.populate('categoryId.productId');

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
    // Check if SKU exist
    const checkSKU = await Product.findOne({ SKU: req.body.SKU });
    if (checkSKU) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }

    const product = await Product.create(req.body);

    // Update product list in category
    const updateCategory = await Category.findByIdAndUpdate(
      product.categoryId,
      {
        $push: { products: product._id },
      },
      { new: true }
    );

    // If not exist return error
    if (!product || !updateCategory) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
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
    // Check product id exist
    const currentData = await Product.findById(req.params.id);
    if (!currentData) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'Product not exist or not found'
      );
    }
    // Find product id and update new data
    const data = await Product.findByIdAndUpdate(`${req.params.id}`, req.body, {
      new: true,
    });

    // Return error if not find
    if (!data) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.BAD_REQUEST });
    }

    // Get current product data in category
    await Category.findByIdAndUpdate(currentData?.categoryId, {
      $pull: {
        products: req.params.id,
      },
    });

    // Update new product data in category
    await Category.findByIdAndUpdate(data.categoryId, {
      $push: { products: req.params.id },
    });

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
    const data = await Product.findByIdAndUpdate(
      `${req.params.id}`,
      {
        isHidden: true,
      },
      { new: true }
    );

    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
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

    const data = await Product.findByIdAndDelete(req.params.id);
    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_PRODUCT_SUCCESS,
    });
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

    // Check category id and product id exist
    if (!cate_id || !product_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }

    // Get related product by category id
    const relatedProducts = await Product.find({
      categoryId: cate_id,
      _id: { $ne: product_id }, //Not include product is watching
    })
      .limit(10)
      .lean();

    // If related product length = 0 return error
    if (relatedProducts.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    // Sort product to random
    const shuffledProducts = relatedProducts.sort(() => 0.5 - Math.random());

    // Choose first 10 products
    const selectedProducts = shuffledProducts.slice(0, 10);

    // Populate product id to origin id
    const populatedProducts = await Product.populate(selectedProducts, [
      { path: 'originId' },
    ]);

    // If populate not exist return error
    if (!populatedProducts) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
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
  Update_Product,
};
