import { timeCounts } from '@/constants/initialValue';
import { messagesError, messagesSuccess } from '@/constants/messages';
import User from '@/models/User';
import { SECRET_ACCESS_TOKEN, SECRET_REFRESH_TOKEN } from '@/utils/env';
import { comparePassword, hashPassword } from '@/utils/hashPassword';
import { createToken, verifyToken } from '@/utils/jwt';
import 'dotenv/config';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const Register: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.email Email user input
   * @param {string} req.body.password Password user input
   */
  try {
    const { email, password } = req.body;
    const checkEmail = await User.findOne({ email });

    // Check if email exist in database
    if (checkEmail) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.EMAIL_EXIST });
    }

    const hashPass = await hashPassword(password);

    const newUser = await User.create({
      ...req.body,
      password: hashPass,
      roles: 'member',
    });

    if (!newUser) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: messagesError.UNAUTHORIZED,
      });
    }

    const accessToken = createToken(
      { _id: newUser.id },
      SECRET_ACCESS_TOKEN as string,
      '2h'
    );

    // save access token in cookie
    res.cookie('accessToken', accessToken, {
      expires: new Date(Date.now() + (timeCounts.mins_5 || 5 * 60 * 1000)),
      httpOnly: true,
    });

    // Create refresh token and save in cookie
    res.cookie(
      'refreshToken',
      createToken({ _id: newUser.id }, SECRET_REFRESH_TOKEN as string, '1d'),
      {
        expires: new Date(
          Date.now() + (timeCounts.hours_24 || 24 * 60 * 60 * 1000)
        ),
        httpOnly: true,
      }
    );

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
    /**
     * @param {string} req.body.email Email user input
     * @param {string} req.body.password Password user input
     */
    const { email, password } = req.body;

    const userExist = await User.findOne({ email });
    //Check user exist
    if (!userExist) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.EMAIL_NOT_FOUND });
    }

    // If user status = false, return forbidden
    if (!userExist.status) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: messagesError.FORBIDDEN,
      });
    }

    // Check password valid
    if (!(await comparePassword(password, userExist.password as string))) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: messagesError.INVALID_PASSWORD });
    }

    // Create access token
    const accessToken = createToken(
      { _id: userExist.id },
      SECRET_ACCESS_TOKEN as string,
      '2h'
    );

    // Save access token in cookie
    res.cookie('accessToken', accessToken, {
      expires: new Date(Date.now() + (timeCounts.mins_5 || 5 * 60 * 1000)),
      httpOnly: true,
    });

    // Create refresh token and save to cookie
    res.cookie(
      'refreshToken',
      createToken({ _id: userExist.id }, SECRET_REFRESH_TOKEN as string, '1d'),
      {
        expires: new Date(
          Date.now() + (timeCounts.hours_24 || 24 * 60 * 60 * 1000)
        ),
        httpOnly: true,
      }
    );

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
    /**
     * @param {string} req.cookies.refreshToken Refresh token take from cookies
     */
    const refreshToken = req.cookies?.refreshToken;
    // If refresh token ot exist, return empty access token
    if (!refreshToken) {
      return res.status(StatusCodes.CREATED).json({
        accessToken: '',
        res: {},
      });
    }

    // If refresh token exist, verify it
    verifyToken(
      refreshToken,
      SECRET_REFRESH_TOKEN as string,
      async (error: any, decode: any) => {
        // If it error, return invalid token
        if (error) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            message: error || 'Invalid Token',
          });
        } else {
          // If exist, find user was decode in token
          const user = await User.findById(decode._id);

          // If user not exist, return error
          if (!user) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              message: messagesError.BAD_REQUEST,
            });
          }

          // If exist create new access token and refresh token
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
    // Clear token in browser
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    res.status(StatusCodes.NO_CONTENT).json({
      message: messagesSuccess.CLEAR_TOKEN_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

export { checkRefreshToken, clearToken, Login, Register };
