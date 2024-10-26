import { StatusCodes } from '@/http-status-codes/build/cjs';
import { ProductType } from '@/interfaces/Product';
import Category from '@/models/Category';
import { Product } from '@/models/Product';
import { AppError } from '@/utils/errorHandle';

const getAllService = async (query: object, options: object) => {
  const products = await Product.paginate(query, options);

  // Check if any product exist
  if (!products || products.docs.length === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  let maxPrice = 0;
  let minPrice = Number.MAX_SAFE_INTEGER;

  // Check data with the min and max price with the discount
  for (const item of products.docs) {
    const price = item.price - (item.price * item.discount) / 100;
    maxPrice = Math.max(maxPrice, price);
    minPrice = Math.min(minPrice, price);
  }
  return products;
};

const getOneProduct = async (id: string): Promise<ProductType> => {
  const data = await Product.findById(id).populate([
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
  ]);

  // If data not exist
  if (!data) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  return data;
};

const createProduct = async (input: ProductType): Promise<ProductType> => {
  // Check if SKU exist
  const checkSKU = await Product.findOne({ SKU: input.SKU });
  if (checkSKU) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'SKU exist');
  }

  const product = await Product.create(input);

  // Update product list in category
  const updateCategory = await Category.findByIdAndUpdate(
    product.categoryId,
    {
      $push: { products: product._id },
    },
    { new: true },
  );

  // If not exist return error
  if (!product || !updateCategory) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Something was wrong');
  }

  return product;
};

const updateProduct = async (
  id: string,
  input: ProductType,
): Promise<ProductType> => {
  // Check product id exist
  const currentData = await Product.findById(id);
  if (!currentData) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not exist or not found');
  }
  // Find product id and update new data
  const data = await Product.findByIdAndUpdate(`${id}`, input, {
    new: true,
  });

  // Return error if not find
  if (!data) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  // Get current product data in category
  await Category.findByIdAndUpdate(currentData?.categoryId, {
    $pull: {
      products: id,
    },
  });

  // Update new product data in category
  await Category.findByIdAndUpdate(data.categoryId, {
    $push: { products: id },
  });

  return data;
};

const softDelete = async (id: string): Promise<ProductType> => {
  const data = await Product.findByIdAndUpdate(
    `${id}`,
    {
      isHidden: true,
    },
    { new: true },
  );

  if (!data) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Some thing is wrong');
  }
  return data;
};
const hardDelete = async (id: string): Promise<ProductType> => {
  const product = await Product.findById(id);
  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  const data = await Product.findByIdAndDelete(id);
  if (!data) {
    throw new AppError(StatusCodes.BAD_GATEWAY, 'Something is not right');
  }
  return data;
};
const findRelatedProduct = async (categoryId: string, productId: string) => {
  // Check category id and product id exist
  if (!categoryId || !productId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Can not found category or product ID',
    );
  }

  // Get related product by category id
  const relatedProducts = await Product.find({
    categoryId: categoryId,
    _id: { $ne: productId }, //Not include product is watching
  })
    .limit(10)
    .lean();

  // If related product length = 0 return error
  if (relatedProducts.length === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not exist');
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
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found any related product');
  }
  return populatedProducts;
};
export {
  getAllService,
  getOneProduct,
  createProduct,
  updateProduct,
  softDelete,
  hardDelete,
  findRelatedProduct,
};
