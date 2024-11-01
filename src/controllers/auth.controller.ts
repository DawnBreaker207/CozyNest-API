import { timeCounts } from '@/constants/initialValue';
import { messagesSuccess } from '@/constants/messages';
import {
  checkTokenService,
  loginService,
  registerService,
} from '@/services/auth.service';
import { SECRET_ACCESS_TOKEN, SECRET_REFRESH_TOKEN } from '@/utils/env';
import { createToken } from '@/utils/jwt';
import logger from '@/utils/logger';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const Register: RequestHandler = async (req, res, next) => {

  /**
   * @param {string} req.body.email Email user input
   * @param {string} req.body.password Password user input
   */
  const { email, password } = req.body;
  try {
    const newUser = await registerService(email, password, req.body);

    const accessToken = createToken(
      { _id: newUser._id },
      SECRET_ACCESS_TOKEN as string,
      '1h',
    );

    // save access token in cookie
    res.cookie('accessToken', accessToken, {
      expires: new Date(Date.now() + (timeCounts.hours_1 || 60 * 60 * 1000)),
      httpOnly: true,
    });

    // Create refresh token and save in cookie
    res.cookie(
      'refreshToken',
      createToken({ _id: newUser._id }, SECRET_REFRESH_TOKEN as string, '1d'),
      {
        expires: new Date(
          Date.now() + (timeCounts.hours_24 || 24 * 60 * 60 * 1000),
        ),
        httpOnly: true,
      },
    );

    res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.REGISTER_SUCCESS,
      accessToken,
      expires: timeCounts.hours_1 || 60 * 60 * 1000,
      res: newUser,
    });
  } catch (error) {
    logger.log('error', `Catch error in register: ${error}`);
    next(error);
  }
};

const Login: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.email Email user input
   * @param {string} req.body.password Password user input
   */
  const { email, password } = req.body;
  try {
    const userExist = await loginService(email, password);

    // Create access token
    const accessToken = createToken(
      { _id: userExist._id },
      SECRET_ACCESS_TOKEN as string,
      '1h',
    );

    // Save access token in cookie
    res.cookie('accessToken', accessToken, {
      expires: new Date(Date.now() + (timeCounts.hours_1 || 60 * 60 * 1000)),
      httpOnly: true,
    });

    // Create refresh token and save to cookie
    res.cookie(
      'refreshToken',
      createToken({ _id: userExist._id }, SECRET_REFRESH_TOKEN as string, '1d'),
      {
        expires: new Date(
          Date.now() + (timeCounts.hours_24 || 24 * 60 * 60 * 1000),
        ),
        httpOnly: true,
      },
    );

    return res.status(StatusCodes.CREATED).json({
      message: messagesSuccess.LOGIN_SUCCESS,
      accessToken: accessToken,
      expires: timeCounts.hours_1 || 60 * 60 * 1000,
      res: userExist,
    });
  } catch (error) {
    logger.log('error', `Catch error in login: ${error}`);
    next(error);
  }
};

const checkRefreshToken: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.cookies.refreshToken Refresh token take from cookies
   */
  try {
    const refreshToken = req.cookies?.refreshToken;
    // If refresh token ot exist, return empty access token
    if (!refreshToken) {
      return {
        accessToken: '',
        res: {},
      };
    }
    const checkToken = await checkTokenService(refreshToken);

    // If exist create new access token and refresh token
    const accessToken = createToken(
      { _id: checkToken._id },
      SECRET_ACCESS_TOKEN as string,
      '1h',
    );
    res.cookie('accessToken', accessToken),
      {
        expires: new Date(Date.now() + (timeCounts.hours_1 || 60 * 60 * 1000)),
        httpOnly: true,
      };

    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.CHECK_TOKEN_SUCCESS,
      accessToken,
      expires: timeCounts.hours_1 || 60 * 60 * 1000,
      res: checkToken,
    });
  } catch (error) {
    logger.log('error', `Catch error in check refresh token: ${error}`);
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
    logger.log('error', `Catch error in clear token: ${error}`);
    next(error);
  }
};

export { checkRefreshToken, clearToken, Login, Register };
