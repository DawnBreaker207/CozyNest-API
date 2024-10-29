import { JwtPayload } from '@/@types/jsonwebtoken';
import { messagesError } from '@/constants/messages';
import { UserType } from '@/interfaces/User';
import User from '@/models/User';
import { AppError } from '@/utils/errorHandle';
import { checkExpiredToken, decodedToken, verifyToken } from '@/utils/jwt';
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
    // Check token expired

    // Check token valid
    const decode = verifyToken(token);

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

    next();
  } catch (error) {
    next(error);
  }
};
