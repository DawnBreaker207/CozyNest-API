import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const {
  PORT,
  URI,
  SALT,
  JWT,
  CLOUD_NAME,
  API_KEY,
  API_SECRET,
  FOLDER_NAME,
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
} = process.env;
export {
  PORT,
  URI,
  SALT,
  JWT,
  CLOUD_NAME,
  API_KEY,
  API_SECRET,
  FOLDER_NAME,
  EMAIL_PASSWORD,
  EMAIL_USERNAME,
};
