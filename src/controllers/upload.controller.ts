import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import handleUpload from '../configs/cloudinaryConfig';
import { messagesError, messagesSuccess } from '../constants/messages';

const uploadImages: RequestHandler = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    const b64 = Buffer.from(file.buffer).toString('base64');
    let dataURI = 'data:' + req.file?.mimetype + ';base64,' + b64;
    const data = await handleUpload(dataURI);
    if (!data) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.UPLOAD_IMAGES_FAIL,
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

export { uploadImages };
