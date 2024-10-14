import { ErrorRequestHandler, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { messagesError } from '../constants/messages';
export class AppError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 *
 * @param req
 * @param res
 * @param next
 */
export const errorHandleNotFound: RequestHandler = (req, res, next) => {
  const error = new AppError(StatusCodes.NOT_FOUND, messagesError.NOT_FOUND);
  next(error);
};

/**
 *
 * @param err
 * @param req
 * @param res
 * @returns
 */
export const errorHandle: ErrorRequestHandler = (err, req, res) => {
  return res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: {
      name: err || 'Error',
      message: err.message || messagesError.ERROR_SERVER,
      // Throw stack error when throwing custom error
      stack: err.stack,
    },
  });
};
