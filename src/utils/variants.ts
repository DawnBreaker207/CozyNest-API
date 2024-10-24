import { OptionType } from '@/interfaces/Variant';
import { Option, OptionalValue, Variant } from '@/models/Variant';
import { Types } from 'mongoose';
import { AppError } from './errorHandle';
import { StatusCodes } from 'http-status-codes';
import { SkuType } from '@/interfaces/Sku';
import { sortOptions } from './sortOption';
import { ProductCart } from '@/interfaces/Cart';

//* Cart

// Count total price
const countTotal = (arr: { price: number; quantity: number }[]) => {
  return arr.reduce((sum, { price, quantity }) => {
    return sum + price * quantity;
  }, 0);
};

// Find product
const findProduct = <T extends { sku_id: Types.ObjectId | string }>(
  products: T[],
  sku_id: Types.ObjectId | string
): T | undefined => {
  return products.find(
    (product) => product.sku_id.toString() === sku_id.toString()
  );
};
// Remove product in cart
const removeFromCart = (cart: { products: ProductCart[] }, sku_id: string) => {
  return cart.products.filter((product) => {
    return product.sku_id && product.sku_id.toString() !== sku_id;
  }) as Types.DocumentArray<ProductCart>;
};

//* Options
//* Get All Option
// Get all option value and option
const getOptionalValues = async (option: OptionType, id: Types.ObjectId) => {
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

//* Variants
//* Get All Variants
const getOptionalValue = async (id: Types.ObjectId) => {
  const value = await OptionalValue.findById(id).select('-_id value label');
  if (!value) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There is some problem when find option values'
    );
  }
  return value;
};
// Get all color exist in product
const getProductColor = async (array?: any[], options?: OptionType[]) => {
  const option = options?.find(
    (opt) => opt.name === 'color' || opt.name === 'mau'
  );

  // if (!option) {
  //   throw new AppError(StatusCodes.BAD_REQUEST, 'Can not find options');
  // }
  const variant = array?.find(
    (variant) => variant.option_id.toString() === option?._id.toString()
  );
  // if (!variant) {
  //   throw new AppError(StatusCodes.BAD_REQUEST, 'Can not find variants');
  // }
  return await OptionalValue.findById(variant?.option_value_id).select(
    '-_id value label'
  );
};
// Get all variant in product
const getVariants = async (
  sku: SkuType,
  id: Types.ObjectId,
  options: OptionType[]
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

//* Create Variant
// Get optional value exist in options
const getOptionalValuesExist = async (
  option: OptionType,
  id: Types.ObjectId
) => {
  const optionValues = await OptionalValue.find({ option_id: id }).select(
    '_id label value'
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
  let result: any[] = [];
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
export {
  getOptionalValues,
  generateVariant,
  variantOptions,
  getOptionalValuesExist,
  getOptionalValue,
  getProductColor,
  getVariants,
  countTotal,
  removeFromCart,
  findProduct,
};
