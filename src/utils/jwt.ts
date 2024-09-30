import jwt from 'jsonwebtoken';
import { JWT } from './env';

/**
 *
 * @param payload
 * @param SECRET_CODE
 * @param expiresIn
 * @returns
 */
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

/**
 *
 * @param token
 * @param SECRET_CODE
 * @param options
 * @returns
 */
const verifyToken = (
  token: string,
  SECRET_CODE: string = JWT as string,
  options?: any
) => {
  return jwt.verify(token, SECRET_CODE, options);
};
export { createToken, verifyToken };
