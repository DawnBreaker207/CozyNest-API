import { CategoryType } from '@/interfaces/Category';
import Category from '@/models/Category';
import { Product } from '@/models/Product';
import { Variant } from '@/models/Variant';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';
import { StatusCodes } from 'http-status-codes';
const getOneCategoryService = async (id: string) => {
  // Tìm kiếm category và lấy danh sách product_ids
  const category = await Category.findById(id).populate({
    path: 'products',
    populate: {
      path: 'variants',
      populate: {
        path: 'sku_id',
        select: 'SKU name price stock image',
      },
    },
  });

  if (!category || !category.products) {
    logger.log('error', 'Category is not found in get one category');
    throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  // Lấy danh sách product_ids
  const productIds = category.products.map((product: any) => product._id);

  // Lấy thông tin chi tiết variants của tất cả products trong category
  const variants = await Variant.find({
    product_id: { $in: productIds },
  })
    .populate('sku_id') // Lấy thông tin chi tiết của SKU
    .populate('option_id') // Lấy thông tin chi tiết của Option
    .populate('option_value_id') // Lấy thông tin chi tiết của OptionValue
    .exec();

  // Gắn variants vào từng product
  const productsWithVariants = category.products.map((product: any) => {
    return {
      ...product._doc,
      variants: variants.filter(
        (variant) => variant.product_id.toString() === product._id.toString(),
      ),
    };
  });

  return {
    ...category.toObject(),
    products: productsWithVariants,
  };
};

const GetAllCategoriesService = async (query: object) => {
  const category = await Category.find({
    isHidden: false,
    name: {
      $regex: (query as { _q?: string })?._q || '',
      $options: 'i',
    },
  }).populate({
    path: 'products',
    populate: {
      path: 'variants',
      populate: {
        path: 'sku_id',
        select: 'SKU name price stock image',
      },
    },
  });

  if (!category || category.length === 0) {
    logger.log('error', 'Category is not found in get all category');
    throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
  }
  return category;
};
const createCategoryService = async (
  type: string,
  input: CategoryType,
): Promise<CategoryType> => {
  const defaultCategory = await Category.findOne({ type });
  if (defaultCategory && defaultCategory.type === 'default') {
    logger.log('error', 'Category default are exist in get all category');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Default category exist');
  }

  const category = await Category.create(input);
  if (!category) {
    logger.log('error', 'Category is error when creating in create category');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Error when creating category');
  }
  return category;
};
const updateCategoryService = async (id: string, input: CategoryType) => {
  const existCategory = await Category.findById({ _id: id });

  if (!existCategory) {
    logger.log('error', 'Category is not found in update category');
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found existing category');
  }

  const category = await Category.findByIdAndUpdate(id, input, {
    new: true,
  });
  return category;
};
// TODO: Update logic 
const hideCategoryService = async (id: string): Promise<CategoryType> => {
  const data = await Category.findByIdAndUpdate(
    `${id}`,
    {
      isHidden: true,
    },
    { new: true },
  );
  if (!data) {
    logger.log('error', 'Category is error when soft delete in hide category');
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Something is wrong when soft delete',
    );
  }
  return data;
};
const deleteCategoryService = async (id: string): Promise<CategoryType> => {
  const category = await Category.findOne({ _id: id });
  if (!category) {
    logger.log('error', 'Category is not found in delete category');
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found category');
  }

  // Can't delete default category
  const defaultCategory = await Category.findOne({ type: 'default' });

  if (category?.type === 'default') {
    logger.log('error', 'Category default can not delete in delete category');
    throw new AppError(StatusCodes.BAD_REQUEST, 'This is a default category');
  }

  if (defaultCategory) {
    // Update multiple products
    const defaultCategoryId = defaultCategory._id;
    if (category._id) {
      await Product.updateMany(
        { category: category._id },
        { $set: { category: defaultCategoryId } },
      );

      // Add product Id to default category
      if (category.products && category.products.length > 0) {
        await Category.findByIdAndUpdate(
          defaultCategoryId,
          {
            $push: { products: { $each: category?.products } },
          },
          { new: true },
        );
      }
    }
  }

  // Remove category with id
  const removeCategory = await Category.findByIdAndDelete({
    _id: id,
  });

  if (!removeCategory) {
    logger.log('error', 'Category is not found in remove category');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Remove category failed');
  }
  return removeCategory;
};
export {
  createCategoryService,
  deleteCategoryService,
  GetAllCategoriesService,
  getOneCategoryService,
  hideCategoryService,
  updateCategoryService,
};
