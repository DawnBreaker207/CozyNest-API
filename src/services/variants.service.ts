import { messagesError } from '@/constants/messages';
import { SkuType } from '@/interfaces/Sku';
import { OptionType, OptionValueType } from '@/interfaces/Variant';
import { Product } from '@/models/Product';
import { Sku } from '@/models/Sku';
import { Option, OptionValue, Variant } from '@/models/Variant';
import { AppError } from '@/utils/errorHandle';
import { slugify } from '@/utils/formatters';
import logger from '@/utils/logger';
import { sortOptions } from '@/utils/sortOption';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import mongoose, { Types } from 'mongoose';

//* Options
//* Get All Option
// Get all option value and option
const getOptionValues = async (option: OptionType, id: Types.ObjectId) => {
  const optionValues = await OptionValue.find({ option_id: id }).select(
    '_id label value',
  );
  if (!optionValues) {
    logger.log('error', 'Option values not found in get option values');
    throw new AppError(StatusCodes.BAD_REQUEST, 'Option values not found');
  }
  const formattedOptionValues = optionValues.map((optionValue) => ({
    option_value_id: optionValue._id,
    label: optionValue.label,
    value: optionValue.value,
  }));

  return {
    name: option.name,
    position: option.position,
    option_id: id,
    option_values: formattedOptionValues,
  };
};

//* Variants
//* Get All Variants
// const getSingleOptionValue = async (id: Types.ObjectId) => {
//   const value = await OptionValue.findById(id).select('-_id value');
//   if (!value) {
//     logger.log('error', 'Option values not found in get option value');
//     throw new AppError(
//       StatusCodes.BAD_REQUEST,
//       'There is some problem when find option values',
//     );
//   }
//   return value;
// };
// Get all color exist in product
// const getProductColor = async (array?: any[], options?: OptionType[]) => {
//   const option = options?.find(
//       (opt) => opt.name === 'color' || opt.name === 'mau',
//     ),
//     variant = array?.find(
//       (variant) => variant.option_id.toString() === option?._id.toString(),
//     );

//   return await OptionValue.findById(variant?.option_value_id).select(
//     '-_id value label',
//   );
// };
// Get all variant in product
const getVariants = async (
  sku: SkuType,
  skuId: Types.ObjectId,
  options: OptionType[],
) => {
  const variants = await Variant.find({ sku_id: skuId }).populate({
    path: 'option_value_id',
    select: 'value label', // Lấy giá trị option value
    populate: {
      path: 'option_id', // Dùng option_id để lấy thông tin tùy chọn của mỗi option value
      model: 'Option',
      select: 'name position', // Chọn thông tin name và position của option
    },
  });

  // if (!variants || variants.length === 0) {
  //   logger.log('error', 'Not variant found in get variants');
  //   throw new AppError(StatusCodes.BAD_REQUEST, 'No variants found');
  // }
  // TODO: Understand this shit
  const optionFilter = await Promise.all(
    variants.map(async (variant) => {
      const optionValues = await OptionValue.find({
        _id: variant.option_value_id,
      });
      if (!optionValues || optionValues.length === 0) {
        logger.log('error', 'Option values not found for variant');
        throw new AppError(StatusCodes.BAD_REQUEST, 'Option values not found');
      }

      // Lấy thông tin Option liên quan đến variant
      const optionsWithValue = optionValues.map((optionValue) => {
        const option = options.find(
          (opt) => opt._id.toString() === optionValue.option_id.toString(),
        );
        return {
          name: option?.name,
          position: option?.position ?? 0,
          value: optionValue.value,
        };
      });

      return {
        ...variant.toObject(),
        option_values: optionsWithValue,
      };
    }),
  );

  return {
    ...sku,
    option_value: optionFilter,
  };
};
//* Create Variant
// Get option value exist in options
const getOptionValuesExist = async (option: OptionType, id: Types.ObjectId) => {
  const optionValues = await OptionValue.find({ option_id: id }).select(
    '_id label value',
  );
  return { ...option, option_values: optionValues };
};
// Generate variants
const generateVariant = (input: any[]) => {
  let result: any[][] = [[]]; // Khởi tạo mảng kết quả

  // Kiểm tra input có rỗng không
  if (input.length === 0) return [];

  // Lặp qua từng Option
  for (const option of input) {
    const { option_values, name, _id: optionId } = option;

    // Nếu không có OptionValues, bỏ qua
    if (!option_values || option_values.length === 0) continue;

    const append: any[][] = [];

    // Lặp qua tất cả các kết hợp đã có trong result
    for (const data of result) {
      // Lặp qua các OptionValues của từng Option
      for (const valueObj of option_values) {
        const { value, label, _id: optionValueId } = valueObj;

        // Tạo một variant mới cho từng kết hợp
        append.push([
          ...data,
          {
            name,
            label,
            value,
            option_id: optionId,
            option_value_id: optionValueId,
          },
        ]);
      }
    }

    result = append; // Cập nhật result với các kết hợp mới
  }

  // Chuyển các kết quả thành các variant objects
  return result;
};

// Create variant options if there was have options and option value
const variantOptions = async (
  product_id: string,
  variants: any[],
  SKUs: any[],
) => {
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
};

//* Options

const getAllOptionsService = async (id: string) => {
  const options = await Option.find({ product_id: id });
  // if (!options || options.length === 0) {
  //   logger.log('error', 'Options not found in get all options');
  //   throw new AppError(StatusCodes.NOT_FOUND, 'Can not find options');
  // }

  const optionsSort = sortOptions(options);
  // Lấy thông tin đầy đủ các option và option values
  const data = await Promise.all(
    optionsSort.map((option) => getOptionValues(option.toObject(), option._id)),
  );
  // if (!data || data.length === 0) {
  //   logger.log(
  //     'error',
  //     'Options and option values not found in get all options',
  //   );
  //   throw new AppError(
  //     StatusCodes.BAD_REQUEST,
  //     'Can not find option and option values',
  //   );
  // }
  return data;
};

const getOneOptionService = async (id: string) => {
  // Tìm option theo ID
  const option = await Option.findById(id).select(
    '_id name position created_at updated_at',
  );
  if (!option) {
    logger.log('error', 'Options not found in get one options');
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found option');
  }

  // Tìm option values của option
  const optionValues = await OptionValue.find({ option_id: id }).select(
    '_id label value',
  );
  // if (!optionValues || optionValues.length === 0) {
  //   logger.log('error', 'Option values not found in get one options');
  //   throw new AppError(
  //     StatusCodes.BAD_REQUEST,
  //     'There is some problem when find option values',
  //   );
  // }
  return { option, optionValues };
};

const createOptionService = async (id: string, input: OptionType) => {
  // Chuẩn bị payload cho option
  const payload = {
    ...input,
    product_id: id.trim(),
    name: input.name.trim(),
  };
  const checkProduct = await Product.findById(id);
  if (!checkProduct) {
    logger.log('error', 'Product not found in create option');
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  const checkOption = await Option.findOne({
    product_id: id,
    name: input.name,
  });
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
};

const updateOptionService = async (
  option_id: string,
  input: OptionType & { optionValues?: OptionValueType[] },
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const existingOption = await Option.findById(option_id).session(session);
    if (!existingOption) {
      logger.log('error', 'Option not found in update option service');
      throw new AppError(StatusCodes.NOT_FOUND, 'Not found option');
    }

    const updatedOption = await Option.findByIdAndUpdate(option_id, input, {
      new: true,
      session,
    });
    if (input.optionValues) {
      const optionValuesIds = input.optionValues
        .filter((v) => v._id)
        .map((v) => new Types.ObjectId(v._id));

      await OptionValue.deleteMany({
        option_id: option_id,
        _id: { $in: optionValuesIds },
      }).session(session);

      await Promise.all(
        input.optionValues.map(async (v) => {
          if (v._id) {
            await OptionValue.findByIdAndUpdate(v._id, v, { session });
          } else {
            await OptionValue.create([{ ...v, option_id: option_id }], {
              session,
            });
          }
        }),
      );
    }

    await session.commitTransaction();
    session.endSession();

    return updatedOption;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.log('error', 'Error occurred in update option service', error);
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error occurred');
  }
};

const deleteOptionService = async (option_id: string) => {
  // Tìm option theo ID
  const option = await Option.findById(option_id);
  if (!option) {
    logger.log('error', 'Option not found in delete option');
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found option');
  }

  await Promise.all([
    // Xóa tất cả các option values của option đó
    OptionValue.deleteMany({ option_id: option_id }),
    // Xóa chính option
    Option.deleteOne({ _id: option_id }),
  ]);
  return option;
};

//* Option value
const getAllOptionValuesService = async (
  product_id: string,
  option_id: string,
) => {
  // Check product exist
  const product = await Product.findById({ _id: product_id });
  if (!product) {
    logger.log('error', 'Product not found in get all option value');
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  // Find option value by option id and product di
  const optionValues = await OptionValue.find({
    option_id: option_id,
  }).select('_id label value created_at updated_at');
  // if (!optionValues || optionValues.length === 0) {
  //   logger.log('error', 'Option value not found in get all option value');
  //   throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'Not found option value');
  // }
  return optionValues;
};

const getSingleOptionValueService = async (id: string) => {
  // Find one option value
  const optionValue = await OptionValue.findById(id).select(
    '_id label value created_at updated_at',
  );
  if (!optionValue) {
    logger.log('error', 'Option value not found in get one option value');
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found option value');
  }
  return optionValue;
};

const createOptionValueService = async (
  product_id: string,
  option_id: string,
  option_value: OptionValueType,
) => {
  const options = await Option.findById(option_id);
  if (!options) {
    logger.log('error', 'Options not found in create option value');
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found options');
  }

  const existingValue = await OptionValue.findOne({
    option_id: option_id,
    value: option_value.value,
  });
  if (existingValue) {
    logger.log('error', 'Option value exist in create option value');
    throw new AppError(StatusCodes.CONFLICT, 'Value exist in option value');
  }

  // Create new option value
  const doc = await OptionValue.create({
    ...option_value,
    option_id: option_id,
    product_id: product_id,
  });
  if (!doc) {
    logger.log('error', 'Option value create failed in create option value');
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Something was wrong when create option value',
    );
  }
  return doc;
};

const updateOptionValueService = async (
  value_id: string,
  input: OptionValueType,
) => {
  // Find option value and update
  const doc = await OptionValue.findOneAndUpdate(
    { _id: value_id },
    { ...input, updated_at: moment().toISOString() },
    { new: true },
  );
  if (!doc) {
    logger.log('error', 'Option value not found in update option value');
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found option value');
  }
  return doc;
};

const deleteOptionValueService = async (value_id: string) => {
  // Find option value
  const doc = await OptionValue.findById(value_id);
  if (!doc) {
    logger.log('error', 'Option value not found in delete option value');
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found option value');
  }
  // After find , delete option value with id
  await OptionValue.deleteOne({ _id: value_id });
  return doc;
};

const getAllVariantsService = async (product_id: string) => {
  // Lấy tất cả SKUs cho sản phẩm
  const SKUs = await Sku.find({ product_id });
  // if (!SKUs) {
  //   logger.log('error', 'SKU not found in get all variant');
  //   throw new AppError(
  //     StatusCodes.BAD_REQUEST,
  //     'There is some problems when find SKU',
  //   );
  // }
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
};

const createVariantService = async (product_id: string) => {
  // Check product exist
  const product = await Product.findById(product_id).select(
    '-_id name SKU',
  );
  if (!product) {
    logger.log('error', 'Variants not found in save variant');
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  // Delete all variant and SKU exist in product
  await Promise.all([
    Variant.deleteMany({ product_id }),
    Sku.deleteMany({ product_id }),
  ]);

  // Check options exist
  const options = await Option.find({ product_id: product_id }).select(
    '_id name',
  );
  if (options.length === 0) {
    logger.log('error', 'Option value not exist in save variant');
    throw new AppError(StatusCodes.NOT_FOUND, 'Option value not exist ');
  }

  // Create option values base on options
  const docs = await Promise.all(
    options.map((option) =>
      getOptionValuesExist(option.toObject(), option._id),
    ),
  );
  if (!docs) {
    logger.log('error', 'Option value create failed in save variant');
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There are some problems when create option values ',
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
  // TODO: Understand this
  // Create array of SKUs from variants
  const arraySKUs = variants.map((variant, index) => {
    const variantValues = variant.map((v) => v.value).join(' - '); // Kết hợp các giá trị của option
    const slug = slugify(`${product.name}-${variantValues}`) || 'default-slug';
    return {
      ...product.toObject(),
      name: `${product.name}-${variantValues}`,
      product_id,
      assets: [], // Giả sử chưa có assets
      SKU: `${product.SKU}-${index + 1}`, // SKU dựa trên index
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
  const data = await variantOptions(product_id, variants, SKUs);
  if (!data || data.length === 0) {
    logger.log('error', 'Option values create failed in save variant');
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
};

const deleteVariantService = async (sku_id: string) => {
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

  await Promise.all(
    variants.map(async (variant) => {
      variant.deleted_at = moment(new Date()).toISOString();
      await variant.save();
    }),
  );

  return variants;
};

const getOneVariantService = async (sku_id: string) => {
  // Find SKU
  const sku = await Sku.findOne({ _id: sku_id })
    .populate({
      path: 'product_id',
      select: 'name description',
    })
    // .populate({
    //   path: 'assets',
    //   select: 'id url',
    // })
    .select('-created_at -updated_at -__v');

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
      const optionValue = await OptionValue.findById(variant.option_value_id);
      if (!optionValue) {
        logger.log('error', 'Optional Value not found in get one variant');
        throw new AppError(StatusCodes.NOT_FOUND, 'Can not find option values');
      }
      return {
        _id: option?._id,
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
};


const updateVariantService = async (
  sku_id: string,
  options: any[],
  input: any,
) => {
  console.log(input);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const checkVariant = await Sku.findOne({ _id: sku_id });
    if (!checkVariant) {
      logger.log('error', 'SKU not found in update variant');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There some problem when find SKU',
      );
    }
    const doc = await Sku.findOneAndUpdate(
      { _id: sku_id },
      { ...input, updated_at: moment().toISOString() },
      { new: true, session: session },
    );
    if (!doc) {
      logger.log('error', 'SKU not found in update variant');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There some problem when update SKU',
      );
    }
    if (options.length > 0) {
      await Promise.all(
        options.map(async (option: any) => {
          const optionID = option?._id;
          const optionValueID = option?.option_value?._id;

          if (!optionID || !optionValueID) {
            throw new AppError(
              StatusCodes.BAD_REQUEST,
              'Option or OptionValue ID missing',
            );
          }

          const optionPayload = {
            name: option?.name,
            position: option?.position,
            updated_at: moment().toISOString(),
          };

          const optionValuePayload = {
            label: option?.option_value?.label,
            value: option?.option_value?.value,
            updated_at: moment().toISOString(),
          };

          await Option.findOneAndUpdate(
            { _id: optionID },
            { ...optionPayload, updated_at: moment().toISOString() },
            { new: true, session: session },
          );

          await OptionValue.findOneAndUpdate(
            { _id: optionValueID },
            { ...optionValuePayload, updated_at: moment().toISOString() },
            { new: true, session: session },
          );
        }),
      );
    }
    await session.commitTransaction();
    session.endSession();
    return doc;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    logger.log('error', error);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There some problem when find SKU',
    );
  }
};

export {
  createOptionService,
  createOptionValueService,
  createVariantService,
  deleteOptionService,
  deleteOptionValueService,
  deleteVariantService,
  getAllOptionsService,
  getAllOptionValuesService,
  getAllVariantsService,
  getOneOptionService,
  getOneVariantService,
  getSingleOptionValueService,
  updateOptionService,
  updateOptionValueService,
  updateVariantService,
};
