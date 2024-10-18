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
// Validator schema
import createError from 'http-errors';
import { slugify } from '@/utils/formatters';

//! Option controllers
//Lấy tất cả các option của sản phẩm
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
const getAllOption: RequestHandler = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    const options = await Option.find({ product_id });

    // Function lấy optional values
    const getOptionalValues = async (
      option: OptionType,
      id: Types.ObjectId
    ) => {
      let optionValues = await OptionalValue.find({ option_id: id }).select(
        '_id label value'
      );

      const formattedOptionValues = optionValues.map((optionValue) => ({
        option_value_id: optionValue._id,
        label: optionValue.label,
        value: optionValue.value,
      }));

      return {
        value: option.name,
        label: option.label,
        position: option.position,
        option_id: id,
        option_values: formattedOptionValues,
      };
    };

    // Sort các option trước khi xử lý
    const optionsSort = options.sort((a, b) => a.position - b.position);

    // Lấy thông tin đầy đủ các option và option values
    const data = await Promise.all(
      optionsSort.map((option) =>
        getOptionalValues(option.toObject(), option._id)
      )
    );

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
  try {
    const { product_id, option_id } = req.params;

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
//TODO: Update check duplicate
const createOption: RequestHandler = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    // Chuẩn bị payload cho option
    const payload = {
      ...req.body,
      product_id: product_id,
    };

    // // Xác thực payload
    // const result = optionSchema.safeParse(payload);
    // if (!result.success) {
    //   const errors: Record<string, string> = {};
    //   result.error.errors.forEach((e) => {
    //     errors[e.path.join('.')] = e.message;
    //   });
    //   //TODO: Update sau
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     message: 'Validation errors',
    //     errors,
    //   });
    // }

    // Tạo option mới
    const doc = await Option.create(payload);

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
  try {
    const { option_id } = req.params;
    const payload = req.body;

    // Xác thực dữ liệu gửi lên bằng Zod
    // //TODO Update lại
    // const result = optionSchema.safeParse(payload);
    // if (!result.success) {
    //   const errors: Record<string, string> = {};
    //   result.error.errors.forEach((e) => {
    //     errors[e.path.join('.')] = e.message;
    //   });
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     status: StatusCodes.BAD_REQUEST,
    //     message: 'Validation errors',
    //     errors,
    //   });
    // }

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
  try {
    const { option_id } = req.params;

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
  try {
    const { product_id, option_id } = req.params;

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

    const optionalValues = await OptionalValue.find({
      product_id,
      option_id,
    }).select('_id label value created_at updated_at');

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_OPTION_VALUE_SUCCESS,
      res: optionalValues,
    });
  } catch (error) {
    next(error);
  }
};

const getOneOptionalValue: RequestHandler = async (req, res, next) => {
  try {
    const { value_id } = req.params;

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

//TODO: Check the ref option label exist from optional models
const createOptionalValue: RequestHandler = async (req, res, next) => {
  try {
    const { product_id, option_id } = req.params;
    const payload = {
      ...req.body,
      option_id,
      product_id,
    };

    // Xác thực payload với schema Zod
    // // TODO: Update code sau
    // const result = optionalValuesSchema.safeParse(payload);

    // if (!result.success) {
    //   const errors: Record<string, string> = {};
    //   result.error.errors.forEach((e: any) => {
    //     errors[e.path.join('.')] = e.message;
    //   });
    //   // TODO: Update
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     message: messagesError.BAD_REQUEST,
    //     errors,
    //   });
    // }

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
  try {
    const { value_id } = req.params;
    const payload = req.body;

    // Xác thực payload với schema Zod
    // // TODO: update
    // const result = optionalValuesSchema.safeParse(payload);

    // if (!result.success) {
    //   const errors: Record<string, string> = {};
    //   result.error.errors.forEach((e: any) => {
    //     errors[e.path.join('.')] = e.message;
    //   });

    //   // TODO: Update
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     message: messagesError.BAD_REQUEST,
    //     errors,
    //   });
    // }

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
  try {
    const { value_id } = req.params;

    const doc = await OptionalValue.findById(value_id);
    if (!doc) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

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
// Hàm để lấy tất cả biến thể cho một sản phẩm
/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
const getAllVariant: RequestHandler = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    // Lấy tất cả SKUs cho sản phẩm
    const SKUs = await Sku.find({ product_id });

    // Lấy các option cho sản phẩm
    const options = await Option.find({ product_id });

    const getOptionalValue = async (id: Types.ObjectId) => {
      const value = await OptionalValue.findById(id).select('-_id value label');
      return value;
    };

    const getProductColor = async (array: any[]) => {
      const option = options.find(
        (opt) => opt.name === 'color' || opt.name === 'mau'
      );
      if (!option) {
        throw new AppError(StatusCodes.BAD_REQUEST, messagesError.BAD_GATEWAY);
      }
      const variant = array.find(
        (variant) => variant.option_id.toString() === option?._id.toString()
      );
      if (!variant) {
        throw new AppError(StatusCodes.BAD_REQUEST, messagesError.BAD_GATEWAY);
      }
      return await OptionalValue.findById(variant?.option_value_id).select(
        '-_id value label'
      );
    };

    const getVariants = async (sku: SkuType, id: Types.ObjectId) => {
      const variants = await Variant.find({ sku_id: id });
      const color = await getProductColor(variants);

      const optionFilter = await Promise.all(
        variants.map(async (item) => {
          const optionFind = await Option.findById(item.option_id);
          if (!optionFind) {
            throw new AppError(
              StatusCodes.BAD_REQUEST,
              messagesError.BAD_REQUEST
            );
          }
          return {
            ...item.toObject(),
            name: optionFind?.name,
            position: optionFind?.position ?? 0,
            option_value_id: item.option_value_id,
          };
        })
      );

      const optionsFilter = sortOptions(optionFilter);
      const optionValues = await Promise.all(
        optionsFilter.map((doc) => getOptionalValue(doc?.option_value_id))
      );

      return {
        ...sku,
        color,
        option_value: optionValues,
      };
    };

    const data = await Promise.all(
      SKUs.map((sku) => getVariants(sku.toObject(), sku._id))
    );

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.OK,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};

// Hàm để lưu các biến thể
const saveVariant: RequestHandler = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    const product = await Product.findById(product_id).select(
      '-_id name SKU slug price price_before_discount price_discount_percent'
    );

    // Xóa tất cả SKUs và biến thể hiện có
    await Variant.deleteMany({ product_id });
    await Sku.deleteMany({ product_id });

    // Lấy các option
    const options = await Option.find({ product_id }).select('_id name');

    const getOptionValues = async (option: OptionType, id: Types.ObjectId) => {
      const optionValues = await OptionalValue.find({ option_id: id }).select(
        '_id label value'
      );
      return { ...option, option_values: optionValues };
    };

    const docs = await Promise.all(
      options.map((option) => getOptionValues(option.toObject(), option._id))
    );

    const generateVariant = (input: any[]) => {
      if (input.length === 0) return [];

      let result: any[][] = [[]];

      for (const option of input) {
        const { name, _id: optionId, option_values } = option;

        if (option_values.length === 0) continue;

        const append: any[][] = [];

        for (const valueObj of option_values) {
          const { _id: optionValueId, label, value } = valueObj;
          for (const data of result) {
            const newVariant = [
              ...data,
              {
                name,
                label,
                value,
                option_id: optionId,
                option_value_id: optionValueId,
              },
            ];
            append.push(newVariant);
          }
        }

        result = append;
      }

      return result;
    };

    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: StatusCodes.NOT_FOUND,
        message: 'Product not found',
      });
    }
    const variants = generateVariant(docs);
    const arraySKUs = Array(variants.length).fill({
      ...product.toObject(),
      product_id,
      stock: 0,
      assets: [],
    });

    const SKUs = await Promise.all(
      arraySKUs.map(async (item, index) => {
        const variantValues = variants[index].map((v) => v.label).join('-');
        // Nếu variantValues là chuỗi trống hoặc không hợp lệ, slug sẽ được đặt thành 'default-slug'
        const slug =
          slugify(`${product.name}-${variantValues}`) || 'default-slug';

        return Sku.create({
          ...item,
          image: {},
          SKU: `${item.SKU}-${index + 1}`,
          slug,
        });
      })
    );

    const variantOptions = (variants: any[], SKUs: any[]) => {
      let result: any[] = [];
      for (let index in SKUs) {
        console.log(SKUs[index]._id);

        for (let optionValue of variants[index]) {
          result.push({
            product_id,
            name: optionValue.name,
            label: optionValue.label,
            sku_id: SKUs[index]._id,
            option_id: optionValue.option_id,
            option_value_id: optionValue.option_value_id,
          });
        }
      }
      return result;
    };

    const data = variantOptions(variants, SKUs);
    const createVariantData = await Promise.all(
      data.map((item) => Variant.create(item))
    );

    return res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.CREATED,
      res: createVariantData,
    });
  } catch (error) {
    next(error);
  }
};

// Hàm để xóa một biến thể
const deleteVariant: RequestHandler = async (req, res, next) => {
  try {
    const { product_id, sku_id } = req.params;
    const sku = await Sku.findById(sku_id);

    if (!sku) {
      throw new AppError(StatusCodes.NOT_ACCEPTABLE, messagesError.NOT_FOUND);
    }

    const variants = await Variant.find({ sku_id });

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

// Hàm để lấy một biến thể
const getOneVariant: RequestHandler = async (req, res, next) => {
  try {
    const { product_id, sku_id } = req.params;

    const sku = await Sku.findOne({ _id: sku_id }).select(
      '-deleted -deleted_at -created_at -updated_at'
    );
    const variants = await Variant.find({ sku_id }).select(
      '-deleted -deleted_at -created_at -updated_at'
    );

    const options = await Promise.all(
      variants.map(async (variant) => {
        const option = await Option.findById(variant.option_id);
        const optionValue = await OptionalValue.findById(
          variant.option_value_id
        );

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

    const optionSort = sortOptions(options);

    if (!sku) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'Biến thể sản phẩm không tồn tại',
      });
    }
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

// Hàm để cập nhật một biến thể
const updateVariant: RequestHandler = async (req, res, next) => {
  try {
    const { sku_id } = req.params;
    const body = req.body;

    // Xác thực dữ liệu đầu vào
    // //TODO: Update
    // const result = variantSchema.safeParse(body);
    // if (!result.success) {
    //   const errors: Record<string, string> = {};
    //   result.error.errors.forEach((e) => {
    //     errors[e.path.join('.')] = e.message;
    //   });
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     message: 'Validation errors',
    //     errors,
    //   });
    // }

    const { options, ...payload } = body;

    const doc = await Sku.findOneAndUpdate(
      { _id: sku_id },
      { ...payload, updated_at: moment().toISOString() },
      { new: true }
    );

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
  createOption,
  createOptionalValue,
  deleteOption,
  deleteOptionalValue,
  deleteVariant,
  // Option Properties
  getAllOption,
  // Optional Value
  getAllOptionalValue,
  // Variant
  getAllVariant,
  getOneOption,
  getOneOptionalValue,
  getOneVariant,
  saveVariant,
  updateOption,
  updateOptionalValue,
  updateVariant,
};
