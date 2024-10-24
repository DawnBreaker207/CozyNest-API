import { messagesError } from '@/constants/messages';
import { UserType } from '@/interfaces/User';
import User from '@/models/User';
import { SECRET_ACCESS_TOKEN } from '@/utils/env';
import { AppError } from '@/utils/errorHandle';
import { verifyToken } from '@/utils/jwt';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

export const checkAuth: RequestHandler = async (req, res, next) => {
  try {
    // Check token exist
    const token = req.headers?.authorization?.split(' ')[1];
    if (!token) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.TOKEN_INVALID,
      });
    }

    // Check token valid
    const decode = verifyToken(token) as { _id?: string };

    if (!decode) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.TOKEN_INVALID,
      });
    }
    // Check user valid
    const user: UserType | null = await User.findById(decode._id);
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, 'User not exist');
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
