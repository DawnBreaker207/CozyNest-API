import { RequestHandler } from "express";
import { Sku } from "@/models/Sku";
import { Option } from "@/models/Option";
import { OptionValue } from "@/models/OptionValue";
import { Variant } from "@/models/Variant";
import { Product } from "@/models/Product";
import { StatusCodes } from "http-status-codes";
import { messagesSuccess, messagesError } from "@/constants/messages";
import moment from "moment";
import createError from "http-errors";
import { sortOptions } from "@/utils/sortOption";
import { SkuType } from "@/interfaces/Sku";
import { Types } from "mongoose";
import { OptionType } from "@/interfaces/Option";
import { variantSchema } from "@/validations/variant.validation";

// Hàm để lấy tất cả biến thể cho một sản phẩm
export const getAllVariant: RequestHandler = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    // Lấy tất cả SKUs cho sản phẩm
    const skus = await Sku.find({ product_id });

    // Lấy các option cho sản phẩm
    const options = await Option.find({ product_id });

    const getOptionValue = async (id: Types.ObjectId) => {
      const value = await OptionValue.findById(id).select("-_id value label");
      return value;
    };

    const getProductColor = async (array: any[]) => {
      const option = options.find(
        (opt) => opt.name === "color" || opt.name === "mau"
      );
      const variant = array.find(
        (variant) => variant.option_id.toString() === option?._id.toString()
      );
      return await OptionValue.findById(variant?.option_value_id).select(
        "-_id value label"
      );
    };

    const getVariants = async (sku: SkuType, id: Types.ObjectId) => {
      const variants = await Variant.find({ sku_id: id });
      const color = await getProductColor(variants);

      const optionFilter = await Promise.all(
        variants.map(async (item) => {
          const optionFind = await Option.findById(item.option_id);
          return {
            ...item.toObject(),
            name: optionFind?.name,
            position: optionFind?.position ?? 0,
            option_value_id: item.option_value_id
          };
        })
      );

      const optionsFilter = sortOptions(optionFilter);
      const optionValues = await Promise.all(
        optionsFilter.map((doc) => getOptionValue(doc.option_value_id))
      );

      return {
        ...sku,
        color,
        option_value: optionValues,
      };
    };

    const data = await Promise.all(
      skus.map((sku) => getVariants(sku.toObject(), sku._id))
    );

    return res.json({
      status: StatusCodes.OK,
      message: messagesSuccess.OK,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Hàm để lưu các biến thể
export const saveVariant: RequestHandler = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    const product = await Product.findById(product_id).select(
      "-_id name SKU slug shared_url price price_before_discount price_discount_percent"
    );

    // Xóa tất cả SKUs và biến thể hiện có
    await Variant.deleteMany({ product_id });
    await Sku.deleteMany({ product_id });

    // Lấy các option
    const options = await Option.find({ product_id }).select("_id name");

    const getOptionValues = async (option: OptionType, id: Types.ObjectId) => {
      const optionValues = await OptionValue.find({ option_id: id }).select(
        "_id label value"
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
        message: "Product not found",
      });
    }
    const variants = generateVariant(docs);
    const arraySkus = Array(variants.length).fill({
      ...product.toObject(),
      product_id,
      stock: 0,
      assets: [],
    });

    const skus = await Promise.all(
      arraySkus.map((item, index) =>
        Sku.create({
          ...item,
          image: {},
          SKU: `${item.SKU}-${index + 1}`,
        })
      )
    );

    const variantOptions = (variants: any[], skus: any[]) => {
      let result: any[] = [];
      for (let index in skus) {
        for (let optionValue of variants[index]) {
          result.push({
            product_id,
            name: optionValue.name,
            label: optionValue.label,
            sku_id: skus[index]._id,
            option_id: optionValue.option_id,
            option_value_id: optionValue.option_value_id,
          });
        }
      }
      return result;
    };

    const data = variantOptions(variants, skus);
    const data1 = await Promise.all(data.map((item) => Variant.create(item)));

    return res.status(StatusCodes.CREATED).json({
      status: StatusCodes.CREATED,
      message: messagesSuccess.CREATED,
      data: data1,
    });
  } catch (error) {
    next(error);
  }
};

// Hàm để xóa một biến thể
export const deleteVariant: RequestHandler = async (req, res, next) => {
  try {
    const { product_id, sku_id } = req.params;
    const sku = await Sku.findById(sku_id);

    if (!sku) {
      throw createError.NotFound("Biến thể sản phẩm không tồn tại");
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

    return res.json({
      status: StatusCodes.OK,
      message: messagesSuccess.DELETE_VARIANT_SUCCESS,
      data: variants,
    });
  } catch (error) {
    next(error);
  }
};

// Hàm để lấy một biến thể
export const getOneVariant: RequestHandler = async (req, res, next) => {
  try {
    const { product_id, sku_id } = req.params;

    const sku = await Sku.findOne({ _id: sku_id }).select(
      "-deleted -deleted_at -created_at -updated_at"
    );
    const variants = await Variant.find({ sku_id }).select(
      "-deleted -deleted_at -created_at -updated_at"
    );

    const options = await Promise.all(
      variants.map(async (variant) => {
        const option = await Option.findById(variant.option_id);
        const optionValue = await OptionValue.findById(variant.option_value_id);

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
        status: StatusCodes.NOT_FOUND,
        message: "Biến thể sản phẩm không tồn tại",
      });
    }
    return res.json({
      status: StatusCodes.OK,
      message: messagesSuccess.GET_VARIANT_SUCCESS,
      data: {
        ...sku.toObject(),
        options: optionSort,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Hàm để cập nhật một biến thể
export const updateVariant: RequestHandler = async (req, res, next) => {
  try {
    const { sku_id } = req.params;
    const body = req.body;

    // Xác thực dữ liệu đầu vào
    const result = variantSchema.safeParse(body);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        errors[e.path.join(".")] = e.message;
      });
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: "Validation errors",
        errors,
      });
    }

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
        const optionValues = await OptionValue.find({ option_id: optionID });

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

        await OptionValue.findOneAndUpdate(
          { _id: optionValueID },
          { ...optionValuePayload, updated_at: moment().toISOString() },
          { new: true }
        );
      })
    );

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: messagesSuccess.UPDATE_VARIANT_SUCCESS,
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};
