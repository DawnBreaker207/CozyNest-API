import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { messageError, messagesSuccess } from '../constants/messages';
import { User } from '../models/User';

const showProfile: RequestHandler = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    res
      .status(StatusCodes.OK)
      .json({ message: messagesSuccess.GET_PROFILE_SUCCESS, res: user });
  } catch (error) {
    next(error);
  }
};

export { showProfile };
