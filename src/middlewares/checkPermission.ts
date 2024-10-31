import { messagesError } from '@/constants/messages';
import User from '@/models/User';
import { SECRET_REFRESH_TOKEN } from '@/utils/env';
import { verifyToken } from '@/utils/jwt';
import logger from '@/utils/logger';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const checkPermission: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    // Check token exist in request
    if (!token) {
      logger.log('error', 'Check permission error: Token not exist');
      return res.status(StatusCodes.FORBIDDEN).json({
        message: messagesError.FORBIDDEN,
      });
    }
    // Check token valid
    const decode = verifyToken(token, SECRET_REFRESH_TOKEN) as { _id?: string };
    if (!decode || decode._id) {
      logger.log('error', 'Check permission error: Token not valid');
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.TOKEN_INVALID,
      });
    }

    // Check user exist
    const user = await User.findById(decode._id);
    if (!user) {
      logger.log('error', 'Check permission error: User not exist');
      {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: messagesError.FORBIDDEN,
        });
      }
    }

    // Check user was admin
    if (user.role !== 'admin' && user.role !== 'manager') {
      logger.log('error', 'Check permission error: Permission access denied');
      return res.status(StatusCodes.FORBIDDEN).json({
        message: messagesError.FORBIDDEN,
      });
    }

    req.user = user;
  } catch (error) {
    logger.log('error', `Catch errors in check permission: ${error}`);

    next(error);
  }
};
export { checkPermission };
