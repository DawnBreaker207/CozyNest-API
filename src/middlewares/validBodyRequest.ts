import { messagesError } from '@/constants/messages';
import logger from '@/utils/logger';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodType } from 'zod';

/**
 *
 * @param schema
 * @returns
 */
const validBodyRequest =
  (schema: ZodType<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = schema.safeParse(req.body);
      if (error) {
        const errors = error.errors.map((item) => ({
          message: `${item.message} ${item.path}`,
        }));
        logger.error('error', `Valid body request error: ${errors}`);
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: messagesError.INVALID_BODY_REQUEST,
          errors,
        });
      }
      next();
    } catch (error) {
      logger.error('error', `catch errors in valid body request: ${error}`);
      next(error);
    }
  };

export default validBodyRequest;
