import { API_KEY, API_SECRET, CLOUD_NAME, FOLDER_NAME } from '@/utils/env';
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
    console.log(error);
  }
};

/**
 *
 * @param {string} id Image id
 * @returns
 */
const handleDelete = async (id: string) => {
  try {
    const res = await cloudinary.uploader.destroy(id);
    return res;
  } catch (error) {
    console.log(error);
  }
};

export { cloudinary, handleDelete, handleUpload };
