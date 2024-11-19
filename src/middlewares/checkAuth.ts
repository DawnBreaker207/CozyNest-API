import { messagesError } from '@/constants/messages';
import { UserType } from '@/interfaces/User';
import User from '@/models/User';
import { SECRET_ACCESS_TOKEN } from '@/utils/env';
import { AppError } from '@/utils/errorHandle';
import { createToken, decodedToken, verifyToken } from '@/utils/jwt';
import logger from '@/utils/logger';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

export const checkAuth: RequestHandler = async (req, res, next) => {
  //* Check access and refresh token exist
  const { accessToken, refreshToken } = req.cookies;
  try {
    // TODO: update feature
    // const token = req.headers?.authorization?.split(' ')[1];

    if (accessToken) {
      //* Check access token expired
      const decode = verifyToken(accessToken);
      if (!decode) {
        logger.log('error', 'Check auth error: Token invalid');
      }
    }

    //* If access expired, check refresh token
    const checkRefresh = verifyToken(refreshToken);
    if (!checkRefresh) {
      logger.log('error', 'Check auth error: Refresh token invalid or expired');
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.TOKEN_INVALID,
      });
    }

    //* If refresh exist, create access from refresh and send to cookie
    const refreshDecoded = await decodedToken(refreshToken);
    const newAccess = createToken(
      { sub: refreshDecoded.sub, ...refreshDecoded },
      SECRET_ACCESS_TOKEN as string,
    );
    if (!newAccess) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Error when create access token',
      );
    }
    res.cookie('accessToken', newAccess, {
      httpOnly: true,
    });

    //* Check user exist, decoded token from access
    const decodeAccess = verifyToken(newAccess, SECRET_ACCESS_TOKEN);

    const user: UserType | null = await User.findById(decodeAccess.payload._id);
    if (!user) {
      logger.log('error', 'Check auth error: User not exist');
      throw new AppError(StatusCodes.NOT_FOUND, 'User not exist');
    }
    req.user = user;
    next();
  } catch (error) {
    logger.log('error', `Catch errors in check auth: ${error}`);
    next(error);
  }
};
