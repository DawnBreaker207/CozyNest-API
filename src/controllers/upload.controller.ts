import { handleDelete } from '@/configs/cloudinaryConfig';
import { messagesSuccess } from '@/constants/messages';
import {
  uploadImagesService,
  uploadMultipleService
} from '@/services/upload.service';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const uploadImages: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.file file input
   */
  const file = req.file;
  try {
    const upload = await uploadImagesService(file);

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_IMAGES_SUCCESS,
      res: upload,
    });
  } catch (error) {
    next(error);
  }
};

const uploadMultiple: RequestHandler = async (req, res, next) => {
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
    next(error);
  }
};

const deleteImage: RequestHandler = async (req, res, next) => {
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
    next(error);
  }
};

export { deleteImage, uploadImages, uploadMultiple };

