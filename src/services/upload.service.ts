import { handleUpload } from '@/configs/cloudinaryConfig';
import { messagesError } from '@/constants/messages';
import { StatusCodes } from '@/http-status-codes/build/cjs';
import { AppError } from '@/utils/errorHandle';

const uploadSingle = async (file: Express.Multer.File | undefined) => {
  if (!file || !file.buffer || !file.mimetype) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'File not found of not right format',
    );
  }
  const b64 = Buffer.from(file.buffer).toString('base64');
  const dataURI = 'data:' + file?.mimetype + ';base64,' + b64;
  const data = await handleUpload(dataURI);
  if (!data) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      messagesError.UPLOAD_IMAGES_FAIL,
    );
  }
  return data;
};
const uploadMulti = async (files: Express.Multer.File[] | undefined) => {
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'File not found of not right format',
    );
  }

  const uploadMultiple = files.map((file) => {
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = 'data:' + file?.mimetype + ';base64,' + b64;
    return handleUpload(dataURI);
  });

  const results = await Promise.all(uploadMultiple);

  const uploadFiles = results.map((result) => ({
    url: result?.url,
    public_id: result?.public_id,
  }));

  return uploadFiles;
};
export { uploadSingle, uploadMulti };
