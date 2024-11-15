// Type
import { RequestHandler } from 'express';
// Model
// Message & Status Code
import { messagesSuccess } from '@/constants/messages';
import { StatusCodes } from 'http-status-codes';
// Helper functions, library & utils
import {
  createOptionService,
  createOptionalValueService,
  createVariantService,
  deleteOptionService,
  deleteOptionalValueService,
  deleteVariantService,
  getAllOptionalValuesService,
  getAllOptionsService,
  getAllVariantsService,
  getOneOptionService,
  getOneVariantService,
  getSingleOptionalValueService,
  updateOptionService,
  updateOptionalValueService,
  updateVariantService,
} from '@/services/variants.service';
import logger from '@/utils/logger';

//! Option controllers
//Lấy tất cả các option của sản phẩm
export const getAllOptions: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.product_id Param product_id input
   */
  const { product_id } = req.params;
  try {
    const data = getAllOptionsService(product_id);

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_OPTION_SUCCESS,
      res: data,
    });
  } catch (error) {
    logger.log('error', `Catch error in get all options: ${error}`);
    next(error);
  }
};

// Lấy thông tin một option cụ thể
export const getOneOption: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.option_id Param option_id input
   */
  const { option_id } = req.params;
  try {
    const { option, optionValues } = await getOneOptionService(option_id);
    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_OPTION_SUCCESS,
      res: {
        ...option.toObject(),
        option_values: optionValues,
      },
    });
  } catch (error) {
    logger.log('error', `Catch error in get one option: ${error}`);
    next(error);
  }
};

// Tạo một option mới
export const createOption: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.product_id Param product_id input
   * @param {object} req.body Param body input
   */

  const { product_id } = req.params;
  try {
    // Chuẩn bị payload cho option
    const doc = createOptionService(product_id, req.body);

    return res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.CREATE_OPTION_SUCCESS,
      res: doc,
    });
  } catch (error) {
    logger.log('error', `Catch error in create option: ${error}`);
    next(error);
  }
};

//Cập nhật thông tin một option
export const updateOption: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.option_id Param option_id input
   * @param {object} req.body Param body input
   */
  const { option_id } = req.params;
  try {
    // Tìm và cập nhật option
    const doc = await updateOptionService(option_id, req.body);

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_OPTION_SUCCESS,
      res: doc,
    });
  } catch (error) {
    logger.log('error', `Catch error in update option: ${error}`);
    next(error);
  }
};

//Xóa một option
export const deleteOption: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.option_id Param option_id input
   */
  const { option_id } = req.params;
  try {
    // Tìm option theo ID
    const option = await deleteOptionService(option_id);
    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_OPTION_SUCCESS,
      res: option,
    });
  } catch (error) {
    logger.log('error', `Catch error in delete option: ${error}`);
    next(error);
  }
};

//! Optional Value Controller
export const getAllOptionalValues: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.product_id Param product_id input
   * @param {string} req.params.option_id Param option_id input
   */
  const { product_id, option_id } = req.params;
  try {
    const optionalValues = await getAllOptionalValuesService(
      product_id,
      option_id,
    );

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_OPTION_VALUE_SUCCESS,
      res: optionalValues,
    });
  } catch (error) {
    logger.log('error', `Catch error in get all optional values: ${error}`);
    next(error);
  }
};

export const getSingleOptionalValue: RequestHandler = async (
  req,
  res,
  next,
) => {
  /**
   * @param {string} req.params.value_id Param value_id input
   */
  const { value_id } = req.params;
  try {
    // Find one optional value
    const optionValue = await getSingleOptionalValueService(value_id);

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_OPTION_VALUE_SUCCESS,
      res: optionValue,
    });
  } catch (error) {
    logger.log('error', `Catch error in get one optional value: ${error}`);
    next(error);
  }
};

export const createOptionalValue: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.product_id Param product_id input
   * @param {string} req.params.option_id Param option_id input
   * @param {object} req.body Param body input
   */
  const { product_id, option_id } = req.params;
  try {
    const doc = await createOptionalValueService(
      product_id,
      option_id,
      req.body,
    );

    return res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.CREATE_OPTION_VALUE_SUCCESS,
      res: doc,
    });
  } catch (error) {
    logger.log('error', `Catch error in create optional value: ${error}`);
    next(error);
  }
};

export const updateOptionalValue: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.value_id Param value_id input
   * @param {object} req.body Param body input
   */
  const { value_id } = req.params;
  try {
    const doc = await updateOptionalValueService(value_id, req.body);

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_OPTION_VALUE_SUCCESS,
      res: doc,
    });
  } catch (error) {
    logger.log('error', `Catch error in update optional value: ${error}`);
    next(error);
  }
};

export const deleteOptionalValue: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.value_id Param value_id input
   */
  const { value_id } = req.params;
  try {
    // Find optional value
    const doc = await deleteOptionalValueService(value_id);

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_OPTION_VALUE_SUCCESS,
      res: doc,
    });
  } catch (error) {
    logger.log('error', `Catch error in delete optional value: ${error}`);
    next(error);
  }
};

//! Variant Controllers
// Get all variant exist in product
export const getAllVariants: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.product_id Param product_id input
   */
  const { product_id } = req.params;
  try {
    const data = await getAllVariantsService(product_id);
    return res.status(StatusCodes.OK).json({
      res: data,
    });
  } catch (error) {
    logger.log('error', `Catch error in get all variants: ${error}`);
    next(error);
  }
};

// Create variant and create multiple variants
export const createVariant: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.product_id Param product_id input
   */
  const { product_id } = req.params;
  try {
    const createVariantData = await createVariantService(product_id);

    return res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.CREATED,
      res: createVariantData,
    });
  } catch (error) {
    logger.log('error', `Catch error in create variants: ${error}`);
    next(error);
  }
};

// Delete onr variant
export const deleteVariant: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.sku_id Param sku_id input
   */
  const { sku_id } = req.params;
  try {
    const variants = await deleteVariantService(sku_id);

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_VARIANT_SUCCESS,
      res: variants,
    });
  } catch (error) {
    logger.log('error', `Catch error in delete variant: ${error}`);
    next(error);
  }
};

// Get one variant
export const getOneVariant: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.sku_id Param sku_id input
   */
  const { sku_id } = req.params;
  try {
    const { sku, optionSort } = await getOneVariantService(sku_id);

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.GET_VARIANT_SUCCESS,
      res: {
        ...sku.toObject(),
        options: optionSort,
      },
    });
  } catch (error) {
    logger.log('error', `Catch error in get one variant: ${error}`);
    next(error);
  }
};

// Update one variant
export const updateVariant: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.sku_id Param sku_id input
   * @param {object} req.body Param body input
   */
  const { sku_id } = req.params;
  try {
    const doc = updateVariantService(sku_id, req.body);

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_VARIANT_SUCCESS,
      res: doc,
    });
  } catch (error) {
    logger.log('error', `Catch error in update variant: ${error}`);
    next(error);
  }
};
