import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { messageError, messagesSuccess } from '../constants/messages';
import { Color, Product, Size } from '../models/Product';

//* Colors
const Get_All_Colors: RequestHandler = async (req, res, next) => {
  try {
    const data = await Color.find();

    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_COLOR_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Get_One_Color: RequestHandler = async (req, res, next) => {
  try {
    const data = await Color.findById(req.params.id);

    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_COLOR_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Create_Color: RequestHandler = async (req, res, next) => {
  try {
    const data = await Color.create(req.body);

    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CREATE_COLOR_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Update_Color: RequestHandler = async (req, res, next) => {
  try {
    const data = await Color.findByIdAndUpdate(req.params.id, req.body);

    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_COLOR_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Delete_Color: RequestHandler = async (req, res, next) => {
  try {
    const data = await Color.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_COLOR_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

//* Size
const Get_All_Size: RequestHandler = async (req, res, next) => {
  try {
    const data = await Size.find();

    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_COLOR_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Get_One_Size: RequestHandler = async (req, res, next) => {
  try {
    const data = await Size.findById(req.params.id);

    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_COLOR_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Create_Size: RequestHandler = async (req, res, next) => {
  try {
    const data = await Size.create(req.body);

    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CREATE_COLOR_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Update_Size: RequestHandler = async (req, res, next) => {
  try {
    const data = await Size.findByIdAndUpdate(req.params.id, req.body);

    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_COLOR_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const Delete_Size: RequestHandler = async (req, res, next) => {
  try {
    const data = await Size.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_COLOR_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};
//* Variants
const Create_Variant: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const variant = req.body;

    if (!productId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messageError.NOT_FOUND,
      });
    }

    const findProduct = await Product.findById(productId);

    if (!findProduct) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messageError.NOT_FOUND,
      });
    }

    const existingVariant = findProduct.variants.find((index) => {
      return (
        index.size.name === variant.size && index.color.name === variant.color
      );
    });

    if (existingVariant) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }

    const sizeExists = await Size.findOne({ name: variant.size }).exec();
    const colorExists = await Color.findOne({ name: variant.color }).exec();

    if (!sizeExists || !colorExists) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messageError.NOT_FOUND,
      });
    }

    const newVariant = {
      name: variant.name,
      extra_price: variant.extra_price,
      size: sizeExists,
      color: colorExists,
      thumbnail: variant.thumbnail,
      stock: variant.stock,
    };

    findProduct.variants.push(newVariant);
    await findProduct.save();

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CREATE_VARIANT_SUCCESS,
      res: newVariant,
    });
  } catch (error) {
    next(error);
  }
};

export {
  Create_Color,
  Create_Size,
  Create_Variant,
  Delete_Color,
  Delete_Size,
  Get_All_Colors,
  Get_All_Size,
  Get_One_Color,
  Get_One_Size,
  Update_Color,
  Update_Size,
};
