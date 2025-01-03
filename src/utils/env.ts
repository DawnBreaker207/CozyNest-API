import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const {
  // Port server
  PORT,
  // Database link
  URI,
  // Loop times in bcrypt
  SALT,
  // Cloudinary configs
  CLOUD_NAME,
  FOLDER_NAME,
  API_KEY,
  API_SECRET,
  // Nodemailer configs
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
  // Key JWT
  JWT,
  SECRET_ACCESS_TOKEN,
  SECRET_REFRESH_TOKEN,
  // Momo configs
  MOMO_ACCESS_KEY,
  MOMO_SECRET_KEY,
  MOMO_REDIRECT_URL = 'http://localhost:5173/paymentresult',
  MOMO_IPN_URL = 'http://localhost:8888/api/v1/payment/transaction-status',
  // VNPay configs
  VN_PAY_TMN_CODE,
  VN_PAY_HASH_SECRET = '',
  VN_PAY_URL,
  VN_PAY_RETURN_URL,
  // ZaloPay configs
  ZALO_PAY_APP_ID,
  ZALO_PAY_KEY_1,
  ZALO_PAY_KEY_2,
  ZALO_PAY_ENDPOINT,
  // GHN configs
  TOKEN_SHIPMENT,
  SHIPMENT_SHOP,
  DISTRICT_ID = '1915',
  WARD_CODE = '1B2128',
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
  SECRET_ACCESS_TOKEN,
  SECRET_REFRESH_TOKEN,
  MOMO_ACCESS_KEY,
  MOMO_SECRET_KEY,
  MOMO_REDIRECT_URL,
  MOMO_IPN_URL,
  VN_PAY_TMN_CODE,
  VN_PAY_HASH_SECRET,
  VN_PAY_URL,
  VN_PAY_RETURN_URL,
  ZALO_PAY_APP_ID,
  ZALO_PAY_KEY_1,
  ZALO_PAY_KEY_2,
  ZALO_PAY_ENDPOINT,
  TOKEN_SHIPMENT,
  SHIPMENT_SHOP,
  DISTRICT_ID,
  WARD_CODE,
};
