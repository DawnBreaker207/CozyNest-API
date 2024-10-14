import { RequestHandler } from 'express';
import { Product } from '@/models/Product';
import { OptionValue } from '@/models/OptionValue';
import { optionValuesSchema } from '@/validations/product.validation';
import moment from 'moment';
import { StatusCodes } from 'http-status-codes';
import { messagesError } from '@/constants/messages';


export const getAllOptionValue: RequestHandler = async (req, res, next) => {
  try {
    const { product_id, option_id } = req.params;

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

    const optionValues = await OptionValue.find({
      product_id,
      option_id,
    }).select('_id label value created_at updated_at');

    return res.json({
      status: StatusCodes.OK,
      message: 'Thành công',
      data: optionValues,
    });
  } catch (error) {
    next(error);
  }
};

export const getOneOptionValue: RequestHandler = async (req, res, next) => {
  try {
    const { value_id } = req.params;

    const optionValue = await OptionValue.findById(value_id).select(
      '_id label value created_at updated_at'
    );
    if (!optionValue) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

    return res.json({
      status: StatusCodes.OK,
      message: 'Thành công',
      data: optionValue,
    });
  } catch (error) {
    next(error);
  }
};

export const createOptionValue: RequestHandler = async (req, res, next) => {
  try {
    const { product_id, option_id } = req.params;
    const payload = {
      ...req.body,
      option_id,
      product_id,
    };

     // Xác thực payload với schema Zod
     const result = optionValuesSchema.safeParse(payload);

     if (!result.success) {
       const errors: Record<string, string> = {};
       result.error.errors.forEach((e) => {
         errors[e.path.join('.')] = e.message; 
       });
 
       return res.status(StatusCodes.BAD_REQUEST).json({
         status: StatusCodes.BAD_REQUEST,
         message: messagesError.BAD_REQUEST,
         errors,
       });
     }
 

    const doc = await OptionValue.create(payload);

    return res.status(StatusCodes.CREATED).json({
      status: StatusCodes.CREATED,
      message: 'Thành công',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOptionValue: RequestHandler = async (req, res, next) => {
  try {
    const { value_id } = req.params;
    const payload = req.body;

   // Xác thực payload với schema Zod
   const result = optionValuesSchema.safeParse(payload);

   if (!result.success) {
     const errors: Record<string, string> = {};
     result.error.errors.forEach((e) => {
       errors[e.path.join('.')] = e.message; 
     });

     return res.status(StatusCodes.BAD_REQUEST).json({
       status: StatusCodes.BAD_REQUEST,
       message: messagesError.BAD_REQUEST,
       errors,
     });
   }

    const doc = await OptionValue.findOneAndUpdate(
      { _id: value_id },
      { ...payload, updated_at: moment().toISOString() },
      { new: true }
    );

    if (!doc) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

    return res.json({
      status: StatusCodes.OK,
      message: 'Thành công',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOptionValue: RequestHandler = async (req, res, next) => {
  try {
    const { value_id } = req.params;

    const doc = await OptionValue.findById(value_id);
    if (!doc) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

    await OptionValue.deleteOne({ _id: value_id });

    return res.json({
      status: StatusCodes.OK,
      message: 'Thành công',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};
