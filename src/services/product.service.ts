import { ProductType } from '@/interfaces/Product';
import Cart from '@/models/Cart';
import Category from '@/models/Category';
import { Product } from '@/models/Product';
import { Sku } from '@/models/Sku';
import { Variant } from '@/models/Variant';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';
import { StatusCodes } from 'http-status-codes';

const getAllProductsService = async (query: object, options: object) => {
  // Thêm điều kiện lọc is_hidden: false vào query
  const finalQuery = { ...query };

  const products = await Product.paginate(finalQuery, options);
  if (!products || products.docs.length === 0) {
    logger.log('error', 'Product not found in get all products');
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  const variants = await Variant.find({
    product_id: { $in: products.docs.map((p) => p._id) },
  })
    .populate('sku_id')
    .exec();

  let maxPrice = 0,
    minPrice = Number.MAX_SAFE_INTEGER;

  // Tính toán giá min, max cho các variants
  variants.forEach((variant) => {
    if (variant.sku_id) {
      const price =
        variant.sku_id.price -
        (variant.sku_id.price * (variant.sku_id.price_discount_percent || 0)) /
          100;
      maxPrice = Math.max(maxPrice, price);
      minPrice = Math.min(minPrice, price);
    }
  });

  return products;
};

const getOneProductService = async (id: string): Promise<ProductType> => {
  const data = await Product.findById(id).populate([
    { path: 'category_id', select: 'name' },
    {
      path: 'variants',
      select: 'sku_id images ',
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
  if (!data) {
    logger.log('error', 'Product not found in get one product');
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  return data;
};

const createProductService = async (
  input: ProductType,
): Promise<ProductType> => {
  // Check if SKU exist
  // const checkProduct = await Product.findOne({ SKU: input.SKU });
  // if (checkProduct) {
  //   logger.log('error', 'Product with this SKU already exists');
  //   throw new AppError(
  //     StatusCodes.BAD_REQUEST,
  //     'Product with this SKU already exists',
  //   );
  // }

  const product = await Product.create(input),
    // Update product list in category
    updateCategory = await Category.findByIdAndUpdate(
      product.category_id,
      {
        $push: { products: product._id },
      },
      { new: true },
    );

  // If not exist return error
  if (!product || !updateCategory) {
    logger.log(
      'error',
      'Product create failed or category update failed in create product',
    );
    throw new AppError(StatusCodes.BAD_REQUEST, 'Something was wrong');
  }

  return product;
};

const updateProductService = async (
  id: string,
  input: ProductType,
): Promise<ProductType> => {
  // Check product id exist
  const currentData = await Product.findById(id);
  if (!currentData) {
    logger.log('error', 'Product not exist in get update product');
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not exist or not found');
  }
  // Find product id and update new data
  const data = await Product.findByIdAndUpdate(id, input, {
    new: true,
  });
  if (!data) {
    logger.log('error', 'Product not found in get update product');
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }
  if (input.variants) {
    for (const variant of input.variants) {
      await Variant.findByIdAndUpdate(variant._id, {
        ...variant,
        product_id: data._id,
      });
    }
  }

  // Get current product data in category
  await Category.findByIdAndUpdate(currentData?.category_id, {
    $pull: {
      products: id,
    },
  });

  // Update new product data in category
  await Category.findByIdAndUpdate(data.category_id, {
    $push: { products: id },
  });

  return data;
};
const hideProductService = async (id: string): Promise<ProductType> => {
  const data = await Product.findByIdAndUpdate(
    id,
    {
      is_hidden: true,
    },
    { new: true },
  );
  if (!data) {
    logger.log('error', 'Product not found in hide product');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Some thing is wrong');
  }
  const variants = await Variant.find({ product_id: id }, 'sku_id');
  const skuIds = variants.map((variant) => variant.sku_id);
  if (skuIds.length > 0) {
    // Xóa các sản phẩm liên quan trong carts
    await Cart.updateMany(
      { 'products.sku_id': { $in: skuIds } }, // Tìm cart chứa các SKU
      {
        $pull: { products: { sku_id: { $in: skuIds } } }, // Xóa các SKU đó
      },
    );

    logger.log('info', `Removed SKUs from carts: ${skuIds}`);
  }

  return data;
};
const deleteProductService = async (id: string): Promise<ProductType> => {
  const product = await Product.findById(id);
  if (!product) {
    logger.log('error', 'Product not found in delete product');
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  await Promise.all([
    Variant.deleteMany({ product_id: id }),
    Sku.deleteMany({ product_id: id }),
  ]);
  const data = await Product.findByIdAndDelete(id);
  if (!data) {
    logger.log('error', 'Product can not delete in get delete product');
    throw new AppError(StatusCodes.BAD_GATEWAY, 'Something is not right');
  }
  return data;
};

const findRelatedProductService = async (
  categoryId: string,
  productId: string,
) => {
  // Check category id and product id exist
  if (!categoryId || !productId) {
    logger.log(
      'error',
      'Product or category not found  in find related product',
    );
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Can not found category or product ID',
    );
  }

  // Get related product by category id
  const relatedProducts = await Product.find({
    category_id: categoryId,
    _id: { $ne: productId }, //Not include product is watching
  })
    .limit(10)
    .lean();

  // If related product length = 0 return error
  if (relatedProducts.length === 0) {
    logger.log('error', 'Product not found in find related product');
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not exist');
  }
  // Sort product to random
  const shuffledProducts = relatedProducts.sort(() => 0.5 - Math.random()),
    // Choose first 10 products
    selectedProducts = shuffledProducts.slice(0, 10),
    // Populate product id to origin id
    populatedProducts = await Product.populate(selectedProducts, [
      { path: 'originId' },
    ]);

  // If populate not exist return error
  if (!populatedProducts) {
    logger.log('error', 'Product related not found in find related product');
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found any related product');
  }
  return populatedProducts;
};
export {
  createProductService,
  deleteProductService,
  findRelatedProductService,
  getAllProductsService,
  getOneProductService,
  hideProductService,
  updateProductService,
};
