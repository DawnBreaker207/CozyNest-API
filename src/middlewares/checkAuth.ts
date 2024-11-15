import { messagesError } from '@/constants/messages';
import { UserType } from '@/interfaces/User';
import User from '@/models/User';
import { AppError } from '@/utils/errorHandle';
import { verifyToken } from '@/utils/jwt';
import logger from '@/utils/logger';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

export const checkAuth: RequestHandler = async (req, res, next) => {
  try {
    // Check token exist
// TODO: update feature
    // const token = req.headers?.authorization?.split(' ')[1];
    const token = req.cookies.refreshToken;
    if (!token) {
      logger.log('error', 'Check auth error: Token not exist');
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.TOKEN_INVALID,
      });
    }
    // Check token expired

    // Check token valid
    const decode = verifyToken(token);

    if (!decode) {
      logger.log('error', 'Check auth error: Token invalid');
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.TOKEN_INVALID,
      });
    }

    // Check user valid
    const user: UserType | null = await User.findById(decode._id);
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
