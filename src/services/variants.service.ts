import { messagesError } from '@/constants/messages';
import { StatusCodes } from '@/http-status-codes/build/cjs';
import { SkuType } from '@/interfaces/Sku';
import {
  OptionalValueType,
  OptionType,
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

//* Options
//* Get All Option
// Get all option value and option
const getOptionalValues = async (option: OptionType, id: Types.ObjectId) => {
  const optionValues = await OptionalValue.find({ option_id: id }).select(
    '_id label value',
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

//* Variants
//* Get All Variants
const getOptionalValue = async (id: Types.ObjectId) => {
  const value = await OptionalValue.findById(id).select('-_id value label');
  if (!value) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There is some problem when find option values',
    );
  }
  return value;
};

// Get all color exist in product
const getProductColor = async (array?: any[], options?: OptionType[]) => {
  const option = options?.find(
    (opt) => opt.name === 'color' || opt.name === 'mau',
  );

  const variant = array?.find(
    (variant) => variant.option_id.toString() === option?._id.toString(),
  );

  return await OptionalValue.findById(variant?.option_value_id).select(
    '-_id value label',
  );
};

// Get all variant in product
const getVariants = async (
  sku: SkuType,
  id: Types.ObjectId,
  options: OptionType[],
) => {
  const variants = await Variant.find({ sku_id: id });
  const color = await getProductColor(variants, options);

  const optionFilter = await Promise.all(
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
  );

  const optionsFilter = sortOptions(optionFilter);
  const optionValues = await Promise.all(
    optionsFilter.map((doc) => getOptionalValue(doc?.option_value_id)),
  );

  return {
    ...sku,
    color,
    option_value: optionValues,
  };
};

//* Create Variant
// Get optional value exist in options
const getOptionalValuesExist = async (
  option: OptionType,
  id: Types.ObjectId,
) => {
  const optionValues = await OptionalValue.find({ option_id: id }).select(
    '_id label value',
  );
  return { ...option, option_values: optionValues };
};

// Generate variants
const generateVariant = (input: any[]) => {
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
};

// Create variant options if there was have options and optional value
const variantOptions = (product_id: string, variants: any[], SKUs: any[]) => {
  const result: any[] = [];
  // Loop through a SKU length
  for (let index = 0; index < SKUs.length; index++) {
    console.log('variants SKU', SKUs[index]?._id);

    // // Loop optional value if have in variant
    // Take variant index
    const optionalValue = variants.flat()[index];
    // for (let optionalValue of variants.flat()) {
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
};

const getAllOptionsService = async (id: string) => {
  const options = await Option.find({ product_id: id });
  if (!options) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Can not find options');
  }

  // Sort các option trước khi xử lý
  // const optionsSort = options.sort((a, b) => a.position - b.position);
  const optionsSort = sortOptions(options);

  // Lấy thông tin đầy đủ các option và option values
  const data = await Promise.all(
    optionsSort.map((option) =>
      getOptionalValues(option.toObject(), option._id),
    ),
  );
  if (!data) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Can not find option and optional values',
    );
  }
  return data;
};

const getOneOptionService = async (id: string) => {
  // Tìm option theo ID
  const option = await Option.findById(id).select('_id name');
  if (!option) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found option');
  }

  // Tìm option values của option
  const optionValues = await OptionalValue.find({ id }).select(
    '_id label value',
  );
  if (!optionValues) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There is some problem when find optional values',
    );
  }
  return { option, optionValues };
};

const createOptionService = async (id: string, input: OptionType) => {
  // Chuẩn bị payload cho option
  const payload = {
    ...input,
    product_id: id.trim(),
    name: input.name.trim(),
  };
  const checkOption = await Option.findOne({
    product_id: id,
    name: input.name,
  });

  // Check if option exist, if checkOption = true, option exist
  if (checkOption) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Option exist');
  }
  // Tạo option mới
  const doc = await Option.create(payload);
  if (!doc) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There is some problems when create option',
    );
  }
  return doc;
};

const updateOptionService = async (id: string, input: OptionType) => {
  const doc = await Option.findByIdAndUpdate(id, input, {
    new: true,
  });

  if (!doc) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found option');
  }
  return doc;
};

const deleteOptionService = async (id: string) => {
  // Tìm option theo ID
  const option = await Option.findById(id);
  if (!option) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found option');
  }

  // Xóa tất cả các option values của option đó
  await OptionalValue.deleteMany({ id });

  // Xóa chính option
  await Option.deleteOne({ _id: id });
  return option;
};

const getAllOptionalValueService = async (
  product_id: string,
  option_id: string,
) => {
  // Check product exist
  const product = await Product.findById({ _id: product_id });
  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  // Find optional value by option id and product di
  const optionalValues = await OptionalValue.find({
    product_id,
    option_id,
  }).select('_id label value created_at updated_at');
  if (!optionalValues) {
    throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'Not found optional value');
  }
  return optionalValues;
};

const getSingleOptionalValueService = async (id: string) => {
  // Find one optional value
  const optionValue = await OptionalValue.findById(id).select(
    '_id label value created_at updated_at',
  );
  if (!optionValue) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found optional value');
  }
  return optionValue;
};

const createOptionalValueService = async (
  product_id: string,
  option_id: string,
  input: OptionalValueType,
) => {
  const options = await Option.findById(option_id);

  // Check option exist
  if (!options) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found options');
  }
  const optionalValue = await OptionalValue.findOne({
    product_id,
    option_id,
    label: input.label,
  });

  // Check label exist in optional value
  if (optionalValue) {
    throw new AppError(
      StatusCodes.CONFLICT,
      'Not found existing label in optional value',
    );
  }

  // Check if label and value was string type
  if (typeof input.label !== 'string' || typeof input.label !== 'string') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Label and value must be strings',
    );
  }

  // Check label in optional value and name in option was equally
  if (input.label !== options.name) {
    throw new AppError(
      StatusCodes.BAD_GATEWAY,
      'The label of OptionalValue must match the label of the corresponding Option',
    );
  }

  const payload = {
    ...input,
    option_id,
    product_id,
  };

  // Create new optional value
  const doc = await OptionalValue.create(payload);
  if (!doc) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Something was wrong when create optional value',
    );
  }
};

const updateOptionalValueService = async (
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
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found optional value');
  }
  return doc;
};

const deleteOptionalValueService = async (value_id: string) => {
  // Find optional value
  const doc = await OptionalValue.findById(value_id);
  if (!doc) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found optional value');
  }
  // After find , delete optional value with id
  await OptionalValue.deleteOne({ _id: value_id });
  return doc;
};

const getAllVariantService = async (product_id: string) => {
  // Lấy tất cả SKUs cho sản phẩm
  const SKUs = await Sku.find({ product_id });
  if (!SKUs) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There is some problems when find SKU',
    );
  }
  // Lấy các option cho sản phẩm
  const options = await Option.find({ product_id });
  if (!options) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There is some problems when find options',
    );
  }
  const data = await Promise.all(
    SKUs.map((sku) => getVariants(sku.toObject(), sku._id, options)),
  );
  if (!data) {
    throw new AppError(StatusCodes.BAD_REQUEST, messagesError.BAD_REQUEST);
  }
  return data;
};

const saveVariantService = async (product_id: string) => {
  // Check product exist
  const product = await Product.findById(product_id).select(
    '-_id name SKU slug price price_before_discount price_discount_percent',
  );
  if (!product) {
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
    throw new AppError(StatusCodes.NOT_FOUND, 'Optional value not exist ');
  }

  // Create option values base on options
  const docs = await Promise.all(
    options.map((option) =>
      getOptionalValuesExist(option.toObject(), option._id),
    ),
  );
  if (!docs) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There are some problems when create optional values ',
    );
  }

  // Generate variants
  const variants = generateVariant(docs);

  if (!variants) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There are some problems when create variants',
    );
  }

  // Create array of SKUs from variants
  const arraySKUs = variants.flat().map((variant, index) => {
    const variantValues = variant.label;
    // Nếu variantValues là chuỗi trống hoặc không hợp lệ, slug sẽ được đặt thành 'default-slug'
    const slug = slugify(`${product.name}-${variantValues}`) || 'default-slug';
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
      'There are some problem when creating array SKUs',
    );
  }

  // Create SKU base on variants
  const SKUs = await Promise.all(
    arraySKUs.map(async (item) => {
      return Sku.create({
        ...item,
        image: {},
      });
    }),
  );
  if (!SKUs) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There are some problem when creating SKU ',
    );
  }

  // Combining variant option with variant and SKUs
  const data = variantOptions(product_id, variants, SKUs);
  if (!data || data.length === 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There are some problem when creating option value in variants',
    );
  }

  // Create variant data with SKU
  const createVariantData = await Variant.insertMany(data);
  // const createVariantData = await Promise.all(
  //   data.map((item) => Variant.create(item))
  // );
  if (!createVariantData) {
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
};

const deleteVariantService = async (sku_id: string) => {
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
};

const getOneVariantService = async (sku_id: string) => {
  // Find SKU
  const sku = await Sku.findOne({ _id: sku_id }).select(
    '-deleted -deleted_at -created_at -updated_at',
  );
  if (!sku) {
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
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There is some problems when find variants',
    );
  }

  const options = await Promise.all(
    variants.map(async (variant) => {
      const option = await Option.findById(variant.option_id);
      if (!option) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Can not find options');
      }
      const optionValue = await OptionalValue.findById(variant.option_value_id);
      if (!optionValue) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Can not find option values');
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
    throw new AppError(StatusCodes.BAD_REQUEST, messagesError.BAD_REQUEST);
  }

  const optionSort = sortOptions(options);

  return { sku, optionSort };
};

const updateVariantService = async (sku_id: string, input: VariantType) => {
  const doc = await Sku.findOneAndUpdate(
    { _id: sku_id },
    { ...input, updated_at: moment().toISOString() },
    { new: true },
  );
  if (!doc) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There some problem when find SKU',
    );
  }
  await Promise.all(
    input.option_id.map(async (option: OptionType) => {
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
  getAllOptionalValueService,
  getAllOptionsService,
  getAllVariantService,
  getOneOptionService,
  getOneVariantService,
  getSingleOptionalValueService,
  saveVariantService,
  updateOptionalValueService,
  updateOptionService,
  updateVariantService,
};
