import jwt from 'jsonwebtoken';
import { JWT } from './env';
const createToken = (
  payload: Object,
  SECRET_CODE: string,
  expiresIn = '5m'
) => {
  const token = jwt.sign(payload, SECRET_CODE, {
    expiresIn: expiresIn,
  });
  return token;
};

const verifyToken = (token: string, SECRET_CODE: string, options?: any) => {
  return jwt.verify(token, SECRET_CODE, options);
};
export { createToken, verifyToken };
