import { handleUpload } from '@/configs/cloudinaryConfig';
import { messagesError } from '@/constants/messages';
import { StatusCodes } from '@/http-status-codes/build/cjs';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';

const uploadSingleService = async (file: Express.Multer.File | undefined) => {
    if (!file || !file.buffer || !file.mimetype) {
      logger.log(
        'error',
        'File not found of not right format in update single image',
      );
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'File not found of not right format',
      );
    }
    const b64 = Buffer.from(file.buffer).toString('base64'),
      dataURI = `data:${file?.mimetype};base64,${b64}`,
      data = await handleUpload(dataURI);
    if (!data) {
      logger.log('error', 'File is not upload failed in upload single image');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        messagesError.UPLOAD_IMAGES_FAIL,
      );
    }
    return data;
  },
  uploadMultipleService = async (files: Express.Multer.File[] | undefined) => {
    if (!files || !Array.isArray(files) || files.length === 0) {
      logger.log(
        'error',
        'File not found of not right format in update multiple images',
      );
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'File not found of not right format',
      );
    }

    const uploadMultiple = files.map((file) => {
        const b64 = Buffer.from(file.buffer).toString('base64'),
          dataURI = `data:${file?.mimetype};base64,${b64}`;
        return handleUpload(dataURI);
      }),
      results = await Promise.all(uploadMultiple);
    if (!results) {
      logger.log(
        'error',
        'File is not upload failed in upload multiple images',
      );
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        messagesError.UPLOAD_IMAGES_FAIL,
      );
    }
    const uploadFiles = results.map((result) => ({
      url: result?.url,
      public_id: result?.public_id,
    }));

    return uploadFiles;
  };

export { uploadSingleService, uploadMultipleService };
