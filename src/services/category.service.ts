import { StatusCodes } from '@/http-status-codes/build/cjs';
import { CategoryType } from '@/interfaces/Category';
import Category from '@/models/Category';
import { Product } from '@/models/Product';
import { AppError } from '@/utils/errorHandle';

const GetAllCategoryService = async (query: object) => {
  const category = await Category.find({
    name: {
      $regex: (query as { _q?: string })?._q || '',
      $options: 'i',
    },
  }).populate('products');
  if (!category || category.length === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
  }
  return category;
};

const getOneCategoryService = async (id: string) => {
  const category = await Category.findById(id).populate('products');
  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found category');
  }
  return category;
};

const createCategoryService = async (
  type: string,
  input: CategoryType,
): Promise<CategoryType> => {
  const defaultCategory = await Category.findOne({ type: type });
  if (defaultCategory && defaultCategory.type === 'default') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Can not find default category',
    );
  }

  const category = await Category.create(input);
  if (!category) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Error when creating category');
  }
  return category;
};

const updateCategoryService = async (id: string, input: CategoryType) => {
  const existCategory = await Category.findById({ _id: id });

  if (!existCategory) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found existing category');
  }

  const category = await Category.findByIdAndUpdate(id, input, {
    new: true,
  });
  return category;
};

const hideCategoryService = async (id: string): Promise<CategoryType> => {
  const data = await Category.findByIdAndUpdate(
    `${id}`,
    {
      isHidden: true,
    },
    { new: true },
  );
  if (!data) {
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
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found category');
  }

  // Can't delete default category
  const defaultCategory = await Category.findOne({ type: 'default' });

  if (category?.type === 'default') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'This is not a default category',
    );
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
    throw new AppError(StatusCodes.BAD_REQUEST, 'Remove category failed');
  }
  return removeCategory;
};
export {
  GetAllCategoryService,
  getOneCategoryService,
  createCategoryService,
  updateCategoryService,
  hideCategoryService,
  deleteCategoryService,
};
