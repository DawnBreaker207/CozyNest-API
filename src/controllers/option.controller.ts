import { RequestHandler } from 'express';
import {Option} from '@/models/Option';
import {OptionValue} from '@/models/OptionValue';
import { StatusCodes } from 'http-status-codes';
import { messagesSuccess, messagesError } from '@/constants/messages';
import { OptionType } from '@/interfaces/Option';
import { Types } from 'mongoose';
import { optionSchema } from '@/validations/option.validation';

/**
 * Lấy tất cả các option của sản phẩm
 */
export const getAllOption: RequestHandler = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    const options = await Option.find({ product_id });

    // Function lấy option values
    const getOptionValues = async (option: OptionType, id: Types.ObjectId) => {
      let optionValues = await OptionValue.find({ option_id: id }).select('_id label value');

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
      optionsSort.map((option) => getOptionValues(option.toObject(), option._id))
    );

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: messagesSuccess.GET_OPTION_SUCCESS,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy thông tin một option cụ thể
 */
export const getOneOption: RequestHandler = async (req, res, next) => {
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
    const optionValues = await OptionValue.find({ option_id }).select('_id label value');

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: messagesSuccess.GET_OPTION_SUCCESS,
      data: {
        ...option.toObject(),
        option_values: optionValues,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo một option mới
 */
export const createOption: RequestHandler = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    // Chuẩn bị payload cho option
    const payload = {
      ...req.body,
      product_id: product_id,
    };

    // Xác thực payload
    const result = optionSchema.safeParse(payload); 
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        errors[e.path.join('.')] = e.message;
      });
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: 'Validation errors',
        errors,
      });
    }

    // Tạo option mới
    const doc = await Option.create(payload);

    return res.status(StatusCodes.CREATED).json({
      status: StatusCodes.CREATED,
      message: messagesSuccess.CREATE_OPTION_SUCCESS,
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật thông tin một option
 */
export const updateOption: RequestHandler = async (req, res, next) => {
  try {
    const { option_id } = req.params;
    const payload = req.body;

    // Xác thực dữ liệu gửi lên bằng Zod
    const result = optionSchema.safeParse(payload);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        errors[e.path.join('.')] = e.message;
      });
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: 'Validation errors',
        errors,
      });
    }

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
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Xóa một option
 */
export const deleteOption: RequestHandler = async (req, res, next) => {
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
    await OptionValue.deleteMany({ option_id });

    // Xóa chính option
    await Option.deleteOne({ _id: option_id });

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: messagesSuccess.DELETE_OPTION_SUCCESS,
      data: option,
    });
  } catch (error) {
    next(error);
  }
};


