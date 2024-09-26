import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  cloudinary,
  handleDelete,
  handleUpload,
} from '../configs/cloudinaryConfig';
import { messageError, messagesSuccess } from '../constants/messages';
import { log } from 'console';

const uploadImages: RequestHandler = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    const b64 = Buffer.from(file.buffer).toString('base64');
    let dataURI = 'data:' + req.file?.mimetype + ';base64,' + b64;
    const data = await handleUpload(dataURI);
    if (!data) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messageError.UPLOAD_IMAGES_FAIL,
      });
    }
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_IMAGES_SUCCESS,
      res: data,
    });
  } catch (error) {
    next(error);
  }
};
const uploadMultiple: RequestHandler = async (req, res, next) => {
  try {
    const files = req.files;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }

    const uploadMultiple = files.map((file) => {
      const b64 = Buffer.from(file.buffer).toString('base64');
      let dataURI = 'data:' + file?.mimetype + ';base64,' + b64;
      return handleUpload(dataURI);
    });

    const results = await Promise.all(uploadMultiple);

    const uploadFiles = results.map((result) => ({
      url: result?.url,
      public_id: result?.public_id,
    }));

    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_IMAGES_SUCCESS,
      res: uploadFiles,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
};
const deleteImage: RequestHandler = async (req, res, next) => {
  const publicId = req.params.publicId;
  try {
    await handleDelete(publicId);

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.DELETE_IMAGES_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

export { uploadImages, uploadMultiple, deleteImage };
