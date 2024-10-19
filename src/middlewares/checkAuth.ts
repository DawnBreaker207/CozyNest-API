import { messagesError } from '@/constants/messages';
import { UserType } from '@/interfaces/User';
import User from '@/models/User';
import { verifyToken } from '@/utils/jwt';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

export const checkAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers?.authorization?.split(' ')[1];
    if (!token) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.TOKEN_INVALID,
      });
    }
    const decode = verifyToken(token) as { _id?: string };
    if (!decode) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.TOKEN_INVALID,
      });
    }
    const user: UserType | null = await User.findById(decode._id);

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    next(error);
  }
};
