import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { JWT, SECRET_ACCESS_TOKEN, SECRET_REFRESH_TOKEN } from './env';
import { AppError } from './errorHandle';
import logger from './logger';
/**
 *
 * @param payload
 * @param SECRET_CODE
 * @param expiresIn
 * @returns
 */
const createToken = (
  payload: Record<string, unknown>,
  SECRET_CODE: string,
  expiresIn = '5m',
) => {
  try {
    const sanitizedPayload = { ...payload };
    delete sanitizedPayload['exp']; // Loại bỏ trường exp nếu có

    return jwt.sign(sanitizedPayload, SECRET_CODE, {
      expiresIn,
    });
  } catch (error) {
    logger.log('error', `Create token error . Error ${error} `);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error in create token',
    );
  }
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
  try {
    return <jwt.JwtPayload>jwt.verify(token, SECRET_CODE, options);
  } catch (error) {
    logger.log('error', `Verify token error . Error ${error} `);
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Error in verify token');
  }
};

// Decode token and take payload
const decodedToken = (token: string) => {
  const decoded = <jwt.Jwt>jwt.decode(token, { complete: true });
  if (!decoded) {
    logger.log('error', 'Verify token failed or error');
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error in verify token',
    );
  }
  return decoded.payload as jwt.JwtPayload;
};

// const checkExpiredToken = async (token: string) => {
//   // Decode token and take payload
//   const checkToken = await decodedToken(token);
//   if (!checkToken) {
//     throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid token');
//   }

//   const tokenTimes = new Date((checkToken.exp as number) * 1000),
//     now = new Date();
//   // Check token expired
//   if (tokenTimes < now) {
//     // TODO: check if have refresh token, return new access token
//     return createToken(checkToken.sub as string, SECRET_ACCESS_TOKEN as string);
//   }
//   // if (tokenTimes > now) {
//   // }
// };
export { createToken, decodedToken, verifyToken };
