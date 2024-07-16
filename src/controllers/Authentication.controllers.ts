import 'dotenv/config';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { messageError, messagesSuccess } from '../constants/messages';
import { comparePassword, hashPassword } from '../utils/hashPassword';
import { createToken } from '../utils/jwt';
import { Role, User } from './../models/User';

const Register: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const checkEmail = await User.findOne({ email });
    if (checkEmail) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ messageError: messageError.EMAIL_EXIST });
    }
    const hashPass = await hashPassword(password);
    const defaultRole = await Role.findOne({ name: 'user' });
    const newUser = await User.create({
      ...req.body,
      password: hashPass,
      roles: [defaultRole?.id],
    });
    newUser.password = undefined;
    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.REGISTER_SUCCESS,
      res: newUser,
    });
  } catch (error) {
    next(error);
  }
};
const Login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const userExist = await User.findOne({ email });
    if (!userExist) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messageError.EMAIL_NOT_FOUND });
    }

    if (!(await comparePassword(password, userExist.password as string))) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messageError.INVALID_PASSWORD });
    }

    userExist.password = undefined;

    const token = createToken({ _id: userExist.id }, '10d');

    return res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.LOGIN_SUCCESS,
      res: {
        user: userExist,
        accessToken: token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { Login, Register };
