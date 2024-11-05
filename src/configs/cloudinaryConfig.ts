import { StatusCodes } from 'http-status-codes';
import { API_KEY, API_SECRET, CLOUD_NAME, FOLDER_NAME } from '@/utils/env';
import { AppError } from '@/utils/errorHandle';
import logger from '@/utils/logger';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

/**
 *
 * @param {string} file File input
 * @returns
 */
const handleUpload = async (file: string) => {
    try {
      const res = await cloudinary.uploader.upload(file, {
        resource_type: 'auto',
        folder: FOLDER_NAME,
      });
      return res;
    } catch (error) {
      logger.log(
        'error',
        `Catch errors in handle upload cloudinary : ${error}`,
      );
      throw new AppError(StatusCodes.BAD_REQUEST, error as string);
    }
  },
  /**
   *
   * @param {string} id Image id
   * @returns
   */
  handleDelete = async (id: string) => {
    try {
      const res = await cloudinary.uploader.destroy(id);
      return res;
    } catch (error) {
      logger.log(
        'error',
        `Catch errors in handle delete cloudinary catch errors: ${error}`,
      );

      throw new AppError(StatusCodes.BAD_REQUEST, error as string);
    }
  };

export { cloudinary, handleDelete, handleUpload };
