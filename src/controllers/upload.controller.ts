import { handleDelete } from '@/configs/cloudinaryConfig';
import { messagesSuccess } from '@/constants/messages';
import {
  uploadMultipleService,
  uploadSingleService,
} from '@/services/upload.service';
import logger from '@/utils/logger';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

export const uploadSingle: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.file file input
   */
  const { file } = req;
  try {
    const upload = await uploadSingleService(file);

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_IMAGES_SUCCESS,
      res: upload,
    });
  } catch (error) {
    logger.log('error', `Catch error in upload single image: ${error}`);
    next(error);
  }
};

export const uploadMultiple: RequestHandler = async (req, res, next) => {
  /**
   * @param {string[]} req.files array of files
   */
  const files = req.files as Express.Multer.File[] | undefined;
  try {
    const uploadFiles = await uploadMultipleService(files);

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_IMAGES_SUCCESS,
      res: uploadFiles,
    });
  } catch (error) {
    logger.log('error', `Catch error in upload multiple images: ${error}`);
    next(error);
  }
};

export const deleteImage: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.publicId publicId of a image
   */

  const { publicId } = req.params;
  try {
    await handleDelete(publicId);

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_IMAGES_SUCCESS,
    });
  } catch (error) {
    logger.log('error', `Catch error in delete image: ${error}`);
    next(error);
  }
};
