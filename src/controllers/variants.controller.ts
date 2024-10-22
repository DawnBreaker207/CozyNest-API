// Type
import { SkuType } from '@/interfaces/Sku';
import { OptionType } from '@/interfaces/Variant';
import { RequestHandler } from 'express';
import { Types } from 'mongoose';
// Model
import { Product } from '@/models/Product';
import { Sku } from '@/models/Sku';
import { Option, OptionalValue, Variant } from '@/models/Variant';
// Message & Status Code
import { messagesError, messagesSuccess } from '@/constants/messages';
import { StatusCodes } from 'http-status-codes';
// Helper functions, library & utils
import { AppError } from '@/utils/errorHandle';
import { sortOptions } from '@/utils/sortOption';
import moment from 'moment';
import { slugify } from '@/utils/formatters';
import {
  generateVariant,
  getOptionalValue,
  getOptionalValues,
  getOptionalValuesExist,
  getProductColor,
  getVariants,
  variantOptions,
} from '@/utils/variants';

//! Option controllers
//Lấy tất cả các option của sản phẩm
const getAllOption: RequestHandler = async (req, res, next) => {
  /**
   * @product_id : product id
   */
  const { product_id } = req.params;
  try {
    const options = await Option.find({ product_id });
    if (!options) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Can not find options');
    }

    // Sort các option trước khi xử lý
    // const optionsSort = options.sort((a, b) => a.position - b.position);
    const optionsSort = sortOptions(options);

    // Lấy thông tin đầy đủ các option và option values
    const data = await Promise.all(
      optionsSort.map((option) =>
        getOptionalValues(option.toObject(), option._id)
      )
    );
    if (!data) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Can not find option and optional values'
      );
    }

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_OPTION_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin một option cụ thể
const getOneOption: RequestHandler = async (req, res, next) => {
  /**
   * @product_id :product_id
   * @option_id :option_id
   */
  const { product_id, option_id } = req.params;
  try {
    // Tìm option theo ID
    const option = await Option.findById(option_id).select('_id name');
    if (!option) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: messagesError.NOT_FOUND });
    }

    // Tìm option values của option
    const optionValues = await OptionalValue.find({ option_id }).select(
      '_id label value'
    );
    if (!optionValues) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There is some problem when find optional values'
      );
    }
    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_OPTION_SUCCESS,
      res: {
        ...option.toObject(),
        option_values: optionValues,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Tạo một option mới
const createOption: RequestHandler = async (req, res, next) => {
  /**
   * @product_id :product_id
   * @name :name
   */

  const { product_id } = req.params;
  const { name } = req.body;
  try {
    // Chuẩn bị payload cho option
    const payload = {
      ...req.body,
      product_id: product_id,
    };
    // TODO: Create utils remove white space
    const checkOption = await Option.findOne({
      product_id: product_id,
      name: name,
    });

    // Check if option exist, if checkOption = true, option exist
    if (checkOption) {
      return res.status(StatusCodes.CONFLICT).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    // Tạo option mới
    const doc = await Option.create(payload);
    if (!doc) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There is some problems when create option'
      );
    }

    return res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.CREATE_OPTION_SUCCESS,
      res: doc,
    });
  } catch (error) {
    next(error);
  }
};

//Cập nhật thông tin một option
const updateOption: RequestHandler = async (req, res, next) => {
  /**
   * @option_id :option_id
   * @payload :req.body
   */
  const { option_id } = req.params;
  const payload = req.body;
  try {
    // Tìm và cập nhật option
    const doc = await Option.findByIdAndUpdate(option_id, payload, {
      new: true,
    });

    if (!doc) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: messagesError.NOT_FOUND });
    }

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: messagesSuccess.UPDATE_OPTION_SUCCESS,
      res: doc,
    });
  } catch (error) {
    next(error);
  }
};

//Xóa một option
const deleteOption: RequestHandler = async (req, res, next) => {
  /**
   * @option_id :option_id
   */
  const { option_id } = req.params;
  try {
    // Tìm option theo ID
    const option = await Option.findById(option_id);
    if (!option) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: messagesError.NOT_FOUND });
    }

    // Xóa tất cả các option values của option đó
    await OptionalValue.deleteMany({ option_id });

    // Xóa chính option
    await Option.deleteOne({ _id: option_id });

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_OPTION_SUCCESS,
      res: option,
    });
  } catch (error) {
    next(error);
  }
};

//! Optional Value Controller
const getAllOptionalValue: RequestHandler = async (req, res, next) => {
  /**
   * @product_id :product_id
   * @option_id :option_id
   */
  const { product_id, option_id } = req.params;
  try {
    // Check product exist
    const product = await Product.findById({ _id: product_id });
    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

    // Find optional value by option id and product di
    const optionalValues = await OptionalValue.find({
      product_id,
      option_id,
    }).select('_id label value created_at updated_at');
    if (!optionalValues) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_OPTION_VALUE_SUCCESS,
      res: optionalValues,
    });
  } catch (error) {
    next(error);
  }
};

const getOneOptionalValue: RequestHandler = async (req, res, next) => {
  /**
   * @value_id :value_id
   */
  const { value_id } = req.params;
  try {
    // Find one optional value
    const optionValue = await OptionalValue.findById(value_id).select(
      '_id label value created_at updated_at'
    );
    if (!optionValue) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_OPTION_VALUE_SUCCESS,
      res: optionValue,
    });
  } catch (error) {
    next(error);
  }
};

const createOptionalValue: RequestHandler = async (req, res, next) => {
  /**
   * @value_id : Optional value id
   */
  const { product_id, option_id } = req.params;
  const { label, value } = req.body;
  try {
    // Find option exist in product ID
    const options = await Option.findById(option_id);

    // Check option exist
    if (!options) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }
    const optionalValue = await OptionalValue.findOne({
      product_id,
      option_id,
      label,
    });

    // Check label exist in optional value
    if (optionalValue) {
      throw new AppError(StatusCodes.CONFLICT, messagesError.NOT_FOUND);
    }

    // Check if label and value was string type
    if (typeof label !== 'string' || typeof value !== 'string') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Label and value must be strings',
      });
    }

    // Check label in optional value and name in option was equally
    if (label !== options.name) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          'The label of OptionalValue must match the label of the corresponding Option',
      });
    }

    const payload = {
      ...req.body,
      option_id,
      product_id,
    };

    // Create new optional value
    const doc = await OptionalValue.create(payload);

    return res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.CREATE_OPTION_VALUE_SUCCESS,
      res: doc,
    });
  } catch (error) {
    next(error);
  }
};

const updateOptionalValue: RequestHandler = async (req, res, next) => {
  /**
   * @value_id : Optional value id
   */
  const { value_id } = req.params;
  try {
    const payload = req.body;
    // Find optional value and update
    const doc = await OptionalValue.findOneAndUpdate(
      { _id: value_id },
      { ...payload, updated_at: moment().toISOString() },
      { new: true }
    );

    if (!doc) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_OPTION_VALUE_SUCCESS,
      res: doc,
    });
  } catch (error) {
    next(error);
  }
};

const deleteOptionalValue: RequestHandler = async (req, res, next) => {
  /**
   * @value_id : Optional value id
   */
  const { value_id } = req.params;
  try {
    // Find optional value
    const doc = await OptionalValue.findById(value_id);
    if (!doc) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }
    // After find , delete optional value with id
    await OptionalValue.deleteOne({ _id: value_id });

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_OPTION_VALUE_SUCCESS,
      res: doc,
    });
  } catch (error) {
    next(error);
  }
};

//! Variant Controllers
// Get all variant exist in product
const getAllVariant: RequestHandler = async (req, res, next) => {
  /**
   * @product_id : Product id
   */
  const { product_id } = req.params;
  try {
    // Lấy tất cả SKUs cho sản phẩm
    const SKUs = await Sku.find({ product_id });
    if (!SKUs) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There is some problems when find SKU'
      );
    }
    // Lấy các option cho sản phẩm
    const options = await Option.find({ product_id });
    if (!options) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There is some problems when find options'
      );
    }
    const data = await Promise.all(
      SKUs.map((sku) => getVariants(sku.toObject(), sku._id, options))
    );
    if (!data) {
      throw new AppError(StatusCodes.BAD_REQUEST, messagesError.BAD_REQUEST);
    }
    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.OK,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};

// Create variant and save multiple variants
const saveVariant: RequestHandler = async (req, res, next) => {
  /**
   * @product_id : Product id
   */
  const { product_id } = req.params;
  try {
    // Check product exist
    const product = await Product.findById(product_id).select(
      '-_id name SKU slug price price_before_discount price_discount_percent'
    );
    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: StatusCodes.NOT_FOUND,
        message: 'Product not found',
      });
    }

    // Delete all variant and SKU exist in product
    await Variant.deleteMany({ product_id });
    await Sku.deleteMany({ product_id });

    // Check options exist
    const options = await Option.find({ product_id }).select('_id name');
    if (options.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Optional value not exist ',
      });
    }

    // Create option values base on options
    const docs = await Promise.all(
      options.map((option) =>
        getOptionalValuesExist(option.toObject(), option._id)
      )
    );
    if (!docs) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There are some problems when create optional values '
      );
    }

    // Generate variants
    const variants = generateVariant(docs);

    if (!variants) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There are some problems when create variants'
      );
    }

    // Create array of SKUs from variants
    const arraySKUs = variants.flat().map((variant, index) => {
      const variantValues = variant.label;
      // Nếu variantValues là chuỗi trống hoặc không hợp lệ, slug sẽ được đặt thành 'default-slug'
      const slug =
        slugify(`${product.name}-${variantValues}`) || 'default-slug';
      return {
        ...product.toObject(),
        product_id,
        stock: 0,
        assets: [],
        SKU: `${product.SKU}-${index + 1}`,
        slug,
      };
    });
    if (!arraySKUs) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There are some problem when creating array SKUs'
      );
    }

    // Create SKU base on variants
    const SKUs = await Promise.all(
      arraySKUs.map(async (item) => {
        return Sku.create({
          ...item,
          image: {},
        });
      })
    );
    if (!SKUs) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There are some problem when creating SKU '
      );
    }

    // Combining variant option with variant and SKUs
    const data = variantOptions(product_id, variants, SKUs);
    if (!data) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There are some problem when creating option value in variants'
      );
    }

    // Create variant data with SKU
    const createVariantData = await Promise.all(
      data.map((item) => Variant.create(item))
    );
    if (!createVariantData) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There are some problems when creating variant data'
      );
    }

    // Update product with new variants
    await Product.findByIdAndUpdate(
      product_id,
      {
        $set: { variants: createVariantData.map((variant) => variant.sku_id) },
      },
      { new: true }
    );

    return res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.CREATED,
      res: createVariantData,
    });
  } catch (error) {
    next(error);
  }
};

// Delete onr variant
const deleteVariant: RequestHandler = async (req, res, next) => {
  /**
   * @product_id : Product id
   * @ski_id : SKU id
   */
  const { product_id, sku_id } = req.params;
  try {
    // Check if SKU exist
    const sku = await Sku.findById(sku_id);
    if (!sku) {
      throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'Can not find SKU');
    }

    // Find variant
    const variants = await Variant.find({ sku_id });
    if (!variants) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There is some problem when find variants'
      );
    }
    // Đánh dấu SKU là đã xóa
    sku.deleted_at = new Date();
    await sku.save();

    // Xóa tất cả các variant
    await Promise.all(
      variants.map(async (variant) => {
        variant.deleted_at = new Date();
        return variant.save(); // Cập nhật variant
      })
    );

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_VARIANT_SUCCESS,
      res: variants,
    });
  } catch (error) {
    next(error);
  }
};

// Get one variant
const getOneVariant: RequestHandler = async (req, res, next) => {
  /**
   * @product_id : Product id
   * @ski_id : SKU id
   */
  const { product_id, sku_id } = req.params;
  try {
    // Find SKU
    const sku = await Sku.findOne({ _id: sku_id }).select(
      '-deleted -deleted_at -created_at -updated_at'
    );
    if (!sku) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'There is some problems when find SKU'
      );
    }

    // Find Variants
    const variants = await Variant.find({ sku_id }).select(
      '-deleted -deleted_at -created_at -updated_at'
    );
    if (!variants) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There is some problems when find variants'
      );
    }

    const options = await Promise.all(
      variants.map(async (variant) => {
        const option = await Option.findById(variant.option_id);
        if (!option) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Can not find options');
        }
        const optionValue = await OptionalValue.findById(
          variant.option_value_id
        );
        if (!optionValue) {
          throw new AppError(
            StatusCodes.NOT_FOUND,
            'Can not find option values'
          );
        }
        return {
          _id: option?._id,
          label: option?.label,
          name: option?.name,
          position: option?.position ?? 0,
          option_value: {
            _id: optionValue?._id,
            label: optionValue?.label,
            value: optionValue?.value,
          },
        };
      })
    );
    if (!options) {
      throw new AppError(StatusCodes.BAD_REQUEST, messagesError.BAD_REQUEST);
    }

    const optionSort = sortOptions(options);

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_VARIANT_SUCCESS,
      res: {
        ...sku.toObject(),
        options: optionSort,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update one variant
const updateVariant: RequestHandler = async (req, res, next) => {
  /**
   * @ski_id : SKU id
   */
  const { sku_id } = req.params;
  try {
    const body = req.body;

    const { options, ...payload } = body;

    const doc = await Sku.findOneAndUpdate(
      { _id: sku_id },
      { ...payload, updated_at: moment().toISOString() },
      { new: true }
    );
    if (!doc) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There some problem when find SKU'
      );
    }
    await Promise.all(
      options.map(async (option: OptionType) => {
        const optionID = option._id;
        // Lấy giá trị option từ OptionValueType
        const optionValues = await OptionalValue.find({ option_id: optionID });

        const optionValueID =
          optionValues.length > 0 ? optionValues[0]._id : null;

        const optionPayload = {
          label: option.label,
          name: option.name,
          position: option.position,
        };

        const optionValuePayload = {
          label: optionValues.length > 0 ? optionValues[0].label : '',
          value: optionValues.length > 0 ? optionValues[0].value : '',
        };

        await Option.findOneAndUpdate(
          { _id: optionID },
          { ...optionPayload, updated_at: moment().toISOString() },
          { new: true }
        );

        await OptionalValue.findOneAndUpdate(
          { _id: optionValueID },
          { ...optionValuePayload, updated_at: moment().toISOString() },
          { new: true }
        );
      })
    );

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_VARIANT_SUCCESS,
      res: doc,
    });
  } catch (error) {
    next(error);
  }
};
export {
  getAllOption,
  createOption,
  deleteOption,
  deleteOptionalValue,
  getAllOptionalValue,
  getOneOptionalValue,
  updateOptionalValue,
  createOptionalValue,
  getAllVariant,
  getOneOption,
  getOneVariant,
  deleteVariant,
  saveVariant,
  updateOption,
  updateVariant,
};
