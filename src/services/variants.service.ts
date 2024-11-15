import { messagesError } from '@/constants/messages';
import { StatusCodes } from 'http-status-codes';
import { SkuType } from '@/interfaces/Sku';
import {
  OptionType,
  OptionalValueType,
  VariantType,
} from '@/interfaces/Variant';
import { Product } from '@/models/Product';
import { Sku } from '@/models/Sku';
import { Option, OptionalValue, Variant } from '@/models/Variant';
import moment from 'moment';
import { AppError } from '@/utils/errorHandle';
import { slugify } from '@/utils/formatters';
import { sortOptions } from '@/utils/sortOption';
import { Types } from 'mongoose';
import logger from '@/utils/logger';

//* Options
//* Get All Option
// Get all option value and option
const getOptionalValues = async (option: OptionType, id: Types.ObjectId) => {
    const optionValues = await OptionalValue.find({ option_id: id }).select(
      '_id label value',
    );
    if (!optionValues) {
      logger.log('error', 'Optional values not found in get optional values');
      throw new AppError(StatusCodes.BAD_REQUEST, 'Optional values not found');
    }
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
  },
  //* Variants
  //* Get All Variants
  getOptionalValue = async (id: Types.ObjectId) => {
    const value = await OptionalValue.findById(id).select('-_id value label');
    if (!value) {
      logger.log('error', 'Option values not found in get optional value');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There is some problem when find option values',
      );
    }
    return value;
  },
  // Get all color exist in product
  getProductColor = async (array?: any[], options?: OptionType[]) => {
    const option = options?.find(
        (opt) => opt.name === 'color' || opt.name === 'mau',
      ),
      variant = array?.find(
        (variant) => variant.option_id.toString() === option?._id.toString(),
      );

    return await OptionalValue.findById(variant?.option_value_id).select(
      '-_id value label',
    );
  },
  // Get all variant in product
  getVariants = async (
    sku: SkuType,
    id: Types.ObjectId,
    options: OptionType[],
  ) => {
    const variants = await Variant.find({ sku_id: id }),
      color = await getProductColor(variants, options),
      optionFilter = await Promise.all(
        variants.map(async (item) => {
          const optionFind = await Option.findById(item.option_id);
          if (!optionFind) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Can not find options');
          }
          return {
            ...item.toObject(),
            name: optionFind?.name,
            position: optionFind?.position ?? 0,
            option_value_id: item.option_value_id,
          };
        }),
      ),
      optionsFilter = sortOptions(optionFilter),
      optionValues = await Promise.all(
        optionsFilter.map((doc) => getOptionalValue(doc?.option_value_id)),
      );

    return {
      ...sku,
      color,
      option_value: optionValues,
    };
  },
  //* Create Variant
  // Get optional value exist in options
  getOptionalValuesExist = async (option: OptionType, id: Types.ObjectId) => {
    const optionValues = await OptionalValue.find({ option_id: id }).select(
      '_id label value',
    );
    return { ...option, option_values: optionValues };
  },
  // Generate variants
  generateVariant = (input: any[]) => {
    let result: any[][] = [[]];

    // Check input length
    if (input.length === 0) return [];

    // Loop through options properties
    for (const option of input) {
      const { name, _id: optionId, option_values } = option;

      if (option_values.length === 0) continue;

      const append: any[][] = [];
      // Loop through optional values
      for (const valueObj of option_values) {
        const { _id: optionValueId, label, value } = valueObj;

        // Create new variants
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
  },
  // Create variant options if there was have options and optional value
  variantOptions = (product_id: string, variants: any[], SKUs: any[]) => {
    const result: any[] = [];
    // Loop through a SKU length
    for (let index = 0; index < SKUs.length; index++) {
      logger.log('info', 'variants SKU', SKUs[index]?._id);

      // // Loop optional value if have in variant
      // Take variant index
      const optionalValue = variants.flat()[index];
      // For (let optionalValue of variants.flat()) {
      // If variant index exist create corresponding with sku index
      if (optionalValue)
        result.push({
          product_id,
          name: optionalValue?.name,
          label: optionalValue?.label,
          sku_id: SKUs[index]?._id,
          option_id: optionalValue?.option_id,
          option_value_id: optionalValue?.option_value_id,
        });
    }
    // }
    return result;
  },
  getAllOptionsService = async (id: string) => {
    const options = await Option.find({ product_id: id });

    if (!options) {
      logger.log('error', 'Options not found in get all options');
      throw new AppError(StatusCodes.NOT_FOUND, 'Can not find options');
    }

    // Sort các option trước khi xử lý
    // Const optionsSort = options.sort((a, b) => a.position - b.position);
    const optionsSort = sortOptions(options),
      // Lấy thông tin đầy đủ các option và option values
      data = await Promise.all(
        optionsSort.map((option) =>
          getOptionalValues(option.toObject(), option._id),
        ),
      );
    if (!data) {
      logger.log(
        'error',
        'Options and optional values not found in get all options',
      );
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Can not find option and optional values',
      );
    }
    return data;
  },
  getOneOptionService = async (id: string) => {
    // Tìm option theo ID
    const option = await Option.findById(id).select('_id name');
    if (!option) {
      logger.log('error', 'Options not found in get one options');
      throw new AppError(StatusCodes.NOT_FOUND, 'Not found option');
    }

    // Tìm option values của option
    const optionValues = await OptionalValue.find({ id }).select(
      '_id label value',
    );
    if (!optionValues) {
      logger.log('error', 'Optional values not found in get one options');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There is some problem when find optional values',
      );
    }
    return { option, optionValues };
  },
  createOptionService = async (id: string, input: OptionType) => {
    // Chuẩn bị payload cho option
    const payload = {
        ...input,
        product_id: id.trim(),
        name: input.name.trim(),
      },
      checkOption = await Option.findOne({
        product_id: id,
        name: input.name,
      });

    // Check if option exist, if checkOption = true, option exist
    if (checkOption) {
      logger.log('error', 'Option exist in create option');
      throw new AppError(StatusCodes.BAD_REQUEST, 'Option exist');
    }
    // Tạo option mới
    const doc = await Option.create(payload);
    if (!doc) {
      logger.log('error', 'Option created failed in create option');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There is some problems when create option',
      );
    }
    return doc;
  },
  updateOptionService = async (id: string, input: OptionType) => {
    const doc = await Option.findByIdAndUpdate(id, input, {
      new: true,
    });

    if (!doc) {
      logger.log('error', 'Option not found in update option');
      throw new AppError(StatusCodes.NOT_FOUND, 'Not found option');
    }
    return doc;
  },
  deleteOptionService = async (id: string) => {
    // Tìm option theo ID
    const option = await Option.findById(id);
    if (!option) {
      logger.log('error', 'Option not found in delete option');
      throw new AppError(StatusCodes.NOT_FOUND, 'Not found option');
    }

    // Xóa tất cả các option values của option đó
    await OptionalValue.deleteMany({ id });

    // Xóa chính option
    await Option.deleteOne({ _id: id });
    return option;
  },
  getAllOptionalValuesService = async (
    product_id: string,
    option_id: string,
  ) => {
    // Check product exist
    const product = await Product.findById({ _id: product_id });
    if (!product) {
      logger.log('error', 'Product not found in get all optional value');
      throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    // Find optional value by option id and product di
    const optionalValues = await OptionalValue.find({
      product_id,
      option_id,
    }).select('_id label value created_at updated_at');
    if (!optionalValues) {
      logger.log('error', 'Optional value not found in get all optional value');
      throw new AppError(
        StatusCodes.NOT_ACCEPTABLE,
        'Not found optional value',
      );
    }
    return optionalValues;
  },
  getSingleOptionalValueService = async (id: string) => {
    // Find one optional value
    const optionValue = await OptionalValue.findById(id).select(
      '_id label value created_at updated_at',
    );
    if (!optionValue) {
      logger.log('error', 'Optional value not found in get one optional value');
      throw new AppError(StatusCodes.NOT_FOUND, 'Not found optional value');
    }
    return optionValue;
  },
  createOptionalValueService = async (
    product_id: string,
    option_id: string,
    input: OptionalValueType,
  ) => {
    const options = await Option.findById(option_id);

    // Check option exist
    if (!options) {
      logger.log('error', 'Options not found in create optional value');
      throw new AppError(StatusCodes.NOT_FOUND, 'Not found options');
    }
    const optionalValue = await OptionalValue.findOne({
      product_id,
      option_id,
      label: input.label,
    });

    // Check label exist in optional value
    if (optionalValue) {
      logger.log('error', 'Optional value exist in create optional value');
      throw new AppError(
        StatusCodes.CONFLICT,
        'Not found existing label in optional value',
      );
    }

    // Check if label and value was string type
    if (typeof input.label !== 'string' || typeof input.label !== 'string') {
      logger.log(
        'error',
        'Label and value must be string in create optional value',
      );
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Label and value must be strings',
      );
    }

    // Check label in optional value and name in option was equally
    if (input.label !== options.name) {
      logger.log(
        'error',
        'The label of Optional Value must match the label in create optional value',
      );
      throw new AppError(
        StatusCodes.BAD_GATEWAY,
        'The label of OptionalValue must match the label of the corresponding Option',
      );
    }

    const payload = {
        ...input,
        option_id,
        product_id,
      },
      // Create new optional value
      doc = await OptionalValue.create(payload);
    if (!doc) {
      logger.log(
        'error',
        'Optional value create failed in create optional value',
      );
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Something was wrong when create optional value',
      );
    }
  },
  updateOptionalValueService = async (
    value_id: string,
    input: OptionalValueType,
  ) => {
    // Find optional value and update
    const doc = await OptionalValue.findOneAndUpdate(
      { _id: value_id },
      { ...input, updated_at: moment().toISOString() },
      { new: true },
    );

    if (!doc) {
      logger.log('error', 'Optional value not found in update optional value');
      throw new AppError(StatusCodes.NOT_FOUND, 'Not found optional value');
    }
    return doc;
  },
  deleteOptionalValueService = async (value_id: string) => {
    // Find optional value
    const doc = await OptionalValue.findById(value_id);
    if (!doc) {
      logger.log('error', 'Optional value not found in delete optional value');
      throw new AppError(StatusCodes.NOT_FOUND, 'Not found optional value');
    }
    // After find , delete optional value with id
    await OptionalValue.deleteOne({ _id: value_id });
    return doc;
  },
  getAllVariantsService = async (product_id: string) => {
    // Lấy tất cả SKUs cho sản phẩm
    const SKUs = await Sku.find({ product_id });
    if (!SKUs) {
      logger.log('error', 'SKU not found in get all variant');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There is some problems when find SKU',
      );
    }
    // Lấy các option cho sản phẩm
    const options = await Option.find({ product_id });
    if (!options) {
      logger.log('error', 'Option not found in get all variant');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There is some problems when find options',
      );
    }
    const data = await Promise.all(
      SKUs.map((sku) => getVariants(sku.toObject(), sku._id, options)),
    );
    if (!data) {
      logger.log('error', 'Variants get failed in get all variant');
      throw new AppError(StatusCodes.BAD_REQUEST, 'Variants get failed');
    }
    return data;
  },
  createVariantService = async (product_id: string) => {
    // Check product exist
    const product = await Product.findById(product_id).select(
      '-_id name SKU slug price price_before_discount price_discount_percent',
    );
    if (!product) {
      logger.log('error', 'Variants not found in save variant');
      throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    // Delete all variant and SKU exist in product
    await Promise.all([
      await Variant.deleteMany({ product_id }),
      await Sku.deleteMany({ product_id }),
    ]);

    // Check options exist
    const options = await Option.find({ product_id }).select('_id name');
    if (options.length === 0) {
      logger.log('error', 'Optional value not exist in save variant');
      throw new AppError(StatusCodes.NOT_FOUND, 'Optional value not exist ');
    }

    // Create option values base on options
    const docs = await Promise.all(
      options.map((option) =>
        getOptionalValuesExist(option.toObject(), option._id),
      ),
    );
    if (!docs) {
      logger.log('error', 'Optional value create failed in save variant');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There are some problems when create optional values ',
      );
    }

    // Generate variants
    const variants = generateVariant(docs);

    if (!variants) {
      logger.log('error', 'Variant create failed in save variant');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There are some problems when create variants',
      );
    }

    // Create array of SKUs from variants
    const arraySKUs = variants.flat().map((variant, index) => {
      const variantValues = variant.label,
        // Nếu variantValues là chuỗi trống hoặc không hợp lệ, slug sẽ được đặt thành 'default-slug'
        slug = slugify(`${product.name}-${variantValues}`) || 'default-slug';
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
      logger.log('error', 'SKUs array create failed in save variant');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There are some problem when creating array SKUs',
      );
    }

    // Create SKU base on variants
    const SKUs = await Promise.all(
      arraySKUs.map(async (item) =>
        Sku.create({
          ...item,
          image: {},
        }),
      ),
    );
    if (!SKUs) {
      logger.log('error', 'SKU create failed exist in save variant');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There are some problem when creating SKU ',
      );
    }

    // Combining variant option with variant and SKUs
    const data = variantOptions(product_id, variants, SKUs);
    if (!data || data.length === 0) {
      logger.log('error', 'Optional values create failed in save variant');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There are some problem when creating option value in variants',
      );
    }

    // Create variant data with SKU
    const createVariantData = await Variant.insertMany(data);
    // Const createVariantData = await Promise.all(
    //   Data.map((item) => Variant.create(item))
    // );
    if (!createVariantData) {
      logger.log('error', 'Variant insert many failed in save variant');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There are some problems when creating variant data',
      );
    }

    // Update product with new variants
    await Product.findByIdAndUpdate(
      product_id,
      {
        $set: { variants: createVariantData.map((variant) => variant._id) },
      },
      { new: true },
    );
    return createVariantData;
  },
  deleteVariantService = async (sku_id: string) => {
    // Check if SKU exist
    const sku = await Sku.findById(sku_id);
    if (!sku) {
      logger.log('error', 'SKU not found in delete variant');
      throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'Can not find SKU');
    }

    // Find variant
    const variants = await Variant.find({ sku_id });
    if (!variants) {
      logger.log('error', 'Variant not found in delete variant');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There is some problem when find variants',
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
      }),
    );
    return variants;
  },
  getOneVariantService = async (sku_id: string) => {
    // Find SKU
    const sku = await Sku.findOne({ _id: sku_id }).select(
      '-deleted -deleted_at -created_at -updated_at',
    );
    if (!sku) {
      logger.log('error', 'SKU not found in get one variant');
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'There is some problems when find SKU',
      );
    }

    // Find Variants
    const variants = await Variant.find({ sku_id }).select(
      '-deleted -deleted_at -created_at -updated_at',
    );
    if (!variants) {
      logger.log('error', 'Variant not found in get one variant');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There is some problems when find variants',
      );
    }

    const options = await Promise.all(
      variants.map(async (variant) => {
        const option = await Option.findById(variant.option_id);
        if (!option) {
          logger.log('error', 'Options not found in get one variant');
          throw new AppError(StatusCodes.NOT_FOUND, 'Can not find options');
        }
        const optionValue = await OptionalValue.findById(
          variant.option_value_id,
        );
        if (!optionValue) {
          logger.log('error', 'Optional Value not found in get one variant');
          throw new AppError(
            StatusCodes.NOT_FOUND,
            'Can not find option values',
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
      }),
    );
    if (!options) {
      logger.log('error', 'Option sort failed in get one variant');
      throw new AppError(StatusCodes.BAD_REQUEST, messagesError.BAD_REQUEST);
    }

    const optionSort = sortOptions(options);

    return { sku, optionSort };
  },
  updateVariantService = async (sku_id: string, input: VariantType) => {
    const doc = await Sku.findOneAndUpdate(
      { _id: sku_id },
      { ...input, updated_at: moment().toISOString() },
      { new: true },
    );
    if (!doc) {
      logger.log('error', 'SKU not found in update variant');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There some problem when find SKU',
      );
    }
    await Promise.all(
      input.option_id.map(async (option: OptionType) => {
        const optionID = option._id,
          // Lấy giá trị option từ OptionValueType
          optionValues = await OptionalValue.find({ option_id: optionID }),
          optionValueID = optionValues.length > 0 ? optionValues[0]._id : null,
          optionPayload = {
            label: option.label,
            name: option.name,
            position: option.position,
          },
          optionValuePayload = {
            label: optionValues.length > 0 ? optionValues[0].label : '',
            value: optionValues.length > 0 ? optionValues[0].value : '',
          };

        await Option.findOneAndUpdate(
          { _id: optionID },
          { ...optionPayload, updated_at: moment().toISOString() },
          { new: true },
        );

        await OptionalValue.findOneAndUpdate(
          { _id: optionValueID },
          { ...optionValuePayload, updated_at: moment().toISOString() },
          { new: true },
        );
      }),
    );
    return doc;
  };

export {
  createOptionalValueService,
  createOptionService,
  deleteOptionalValueService,
  deleteOptionService,
  deleteVariantService,
  getAllOptionalValuesService,
  getAllOptionsService,
  getAllVariantsService,
  getOneOptionService,
  getOneVariantService,
  getSingleOptionalValueService,
  createVariantService,
  updateOptionalValueService,
  updateOptionService,
  updateVariantService,
};
