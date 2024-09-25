import 'dotenv/config';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { messagesError, messagesSuccess } from '../constants/messages';
import { Role, User } from '../models/User';
import { comparePassword, hashPassword } from '../utils/hashPassword';
import { createToken, verifyToken } from '../utils/jwt';
import { SECRET_ACCESS_TOKEN, SECRET_REFRESH_TOKEN } from '../utils/env';
import { timeCounts } from '../constants/initialValue';

const Register: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const checkEmail = await User.findOne({ email });

    if (checkEmail) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.EMAIL_EXIST });
    }
    const hashPass = await hashPassword(password);

    const defaultRole = await User.countDocuments({}).then((count) =>
      Role.findOne({ name: count === 0 ? 'admin' : 'user' })
    );

    const newUser = await User.create({
      ...req.body,
      password: hashPass,
      roles: [defaultRole],
    });

    if (!newUser) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: messagesError.UNAUTHORIZED,
      });
    }

    const accessToken = createToken(
      { _id: newUser.id },
      SECRET_ACCESS_TOKEN as string,
      '5m'
    );

    const refreshToken = createToken(
      { _id: newUser.id },
      SECRET_REFRESH_TOKEN as string,
      '1d'
    );

    res.cookie('accessToken', accessToken, {
      expires: new Date(Date.now() + (timeCounts.mins_5 || 5 * 60 * 1000)),
      httpOnly: true,
    });

    res.cookie('refreshToken', refreshToken, {
      expires: new Date(
        Date.now() + (timeCounts.hours_24 || 24 * 60 * 60 * 1000)
      ),
      httpOnly: true,
    });

    newUser.password = undefined;

    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.REGISTER_SUCCESS,
      accessToken,
      expires: timeCounts.mins_10 || 10 * 60 * 1000,
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
        .json({ message: messagesError.EMAIL_NOT_FOUND });
    }
    if (!userExist.status) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: messagesError.FORBIDDEN,
      });
    }

    if (!(await comparePassword(password, userExist.password as string))) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.INVALID_PASSWORD });
    }

    if (!userExist) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }

    const accessToken = createToken(
      { _id: userExist.id },
      SECRET_ACCESS_TOKEN as string,
      '5m'
    );

    const refreshToken = createToken(
      { _id: userExist.id },
      SECRET_REFRESH_TOKEN as string,
      '1d'
    );

    res.cookie('accessToken', accessToken, {
      expires: new Date(Date.now() + (timeCounts.mins_5 || 5 * 60 * 1000)),
      httpOnly: true,
    });

    res.cookie('refreshToken', refreshToken, {
      expires: new Date(
        Date.now() + (timeCounts.hours_24 || 24 * 60 * 60 * 1000)
      ),
      httpOnly: true,
    });

    userExist.password = undefined;

    return res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.LOGIN_SUCCESS,
      accessToken: accessToken,
      expires: timeCounts.mins_10 || 10 * 60 * 1000,
      res: userExist,
    });
  } catch (error) {
    next(error);
  }
};

const checkRefreshToken: RequestHandler = (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(StatusCodes.CREATED).json({
        accessToken: '',
        res: {},
      });
    }
    verifyToken(
      refreshToken,
      SECRET_REFRESH_TOKEN as string,
      async (error, decode) => {
        if (error) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            message: error,
          });
        } else {
          const user = await User.findById(decode._id);
          if (!user) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              message: messagesError.BAD_REQUEST,
            });
          }

          const accessToken = createToken(
            { _id: user.id },
            SECRET_ACCESS_TOKEN as string,
            '1m'
          );
          res.cookie('accessToken', accessToken),
            {
              expires: new Date(
                Date.now() + (timeCounts.mins_5 || 5 * 60 * 1000)
              ),
              httpOnly: true,
            };

          return res.status(StatusCodes.OK).json({
            message: messagesSuccess.CHECK_TOKEN_SUCCESS,
            accessToken,
            expires: timeCounts.mins_10 || 10 * 60 * 1000,
            res: user,
          });
        }
      }
    );
  } catch (error) {
    next(error);
  }
};
const clearToken: RequestHandler = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    res.status(StatusCodes.NO_CONTENT).json({
      message: messagesSuccess.CLEAR_TOKEN_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};
export { Login, Register, clearToken, checkRefreshToken };
