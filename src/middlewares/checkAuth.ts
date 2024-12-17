import { messagesError } from '@/constants/messages';
import { UserType } from '@/interfaces/User';
import User from '@/models/User';
import { SECRET_ACCESS_TOKEN, SECRET_REFRESH_TOKEN } from '@/utils/env';
import { AppError } from '@/utils/errorHandle';
import { createToken, verifyToken } from '@/utils/jwt';
import logger from '@/utils/logger';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
export const checkAuth: RequestHandler = async (req, res, next) => {
  //* Check access and refresh token exist
  const { accessToken, refreshToken } = req.cookies;
  let decoded: jwt.JwtPayload | null = null;
  try {
    if (accessToken) {
      try {
        //* Check access token expired
        decoded = verifyToken(accessToken, SECRET_ACCESS_TOKEN);
      } catch (error) {
        logger.log('error', `Check auth error: Token invalid. Error ${error}`);
      }
    }
    if (!decoded && refreshToken) {
      try {
        //* If access expired, check refresh token
        const refreshDecoded = verifyToken(refreshToken, SECRET_REFRESH_TOKEN);

        //* If refresh exist, create access from refresh and send to cookie
        const newAccessToken = createToken(
          {
            status: refreshDecoded.status,
            _id: refreshDecoded._id,
            sub: refreshDecoded.sub,
          },
          SECRET_ACCESS_TOKEN as string,
        );

        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
        });
        decoded = verifyToken(newAccessToken, SECRET_ACCESS_TOKEN);
      } catch (error) {
        logger.log('error', `Refresh token invalid or expired. Error ${error}`);
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: messagesError.TOKEN_INVALID,
        });
      }
    }

    //* Check user exist, decoded token from access
    if (!decoded) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Authentication required');
    }
    const user: UserType | null = await User.findById(decoded._id);
    if (!user) {
      logger.log('error', 'Check auth error: User not exist');
      throw new AppError(StatusCodes.NOT_FOUND, 'User not exist');
    }

    //* Check user valid, compare status
    if (user.status !== decoded.status) {
      logger.log('error', 'Check auth error: Status compare not valid');
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'Status compare not valid',
      });
      // throw new AppError(StatusCodes.FORBIDDEN, 'Status compare not valid');
    }

    req.user = user;
    next();
  } catch (error) {
    logger.log('error', `Catch errors in check auth: ${error}`);
    next(error);
  }
};
