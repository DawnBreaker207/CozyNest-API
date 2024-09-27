import { messagesError } from '@/constants/messages';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodType } from 'zod';
const validBodyRequest = (schema: ZodType<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = schema.safeParse(req.body);
      if (error) {
        const errors = error.errors.map((item) => ({
          message: item.message + ' ' + item.path,
        }));
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: messagesError.INVALID_BODY_REQUEST,
          errors,
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validBodyRequest;
