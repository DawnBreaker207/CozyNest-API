import { ErrorRequestHandler, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { messagesError } from '../constants/messages';

export const errorHandleNotFound: RequestHandler = (req, res, next) => {
  const error = new Error(messagesError.NOT_FOUND);
  (error as any).status = StatusCodes.NOT_FOUND;
  next(error);
};

export const errorHandle: ErrorRequestHandler = (err, req, res) => {
  return res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: {
      name: err,
      message: err.message || messagesError.ERROR_SERVER,
    },
  });
};
