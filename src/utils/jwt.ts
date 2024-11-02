import { StatusCodes } from '@/http-status-codes/build/cjs';
import jwt from 'jsonwebtoken';
import { JWT, SECRET_ACCESS_TOKEN, SECRET_REFRESH_TOKEN } from './env';
import { AppError } from './errorHandle';
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
  expiresIn = '5m',
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
  SECRET_CODE: string = SECRET_ACCESS_TOKEN ||
    JWT ||
    (SECRET_REFRESH_TOKEN as string),
  options?: jwt.SignOptions | undefined,
) => {
  return <jwt.JwtPayload>jwt.verify(token, SECRET_CODE, options);
};

// Decode token and take payload
const decodedToken = async (token: string) => {
  const decoded = <jwt.Jwt>jwt.decode(token, { complete: true });
  return decoded as jwt.JwtPayload;
};

const checkExpiredToken = async (token: string) => {
  // Decode token and take payload
  const checkToken = await decodedToken(token);
  if (!checkToken) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid token');
  }

  const tokenTimes = new Date((checkToken.exp as number) * 1000);
  const now = new Date();
  // Check token expired
  if (tokenTimes < now) {
    // TODO: check if have refresh token, return new access token
    return createToken(checkToken.sub as string, SECRET_ACCESS_TOKEN as string);
  }
  if (tokenTimes > now) {
    return;
  }
};
export { checkExpiredToken, createToken, decodedToken, verifyToken };
