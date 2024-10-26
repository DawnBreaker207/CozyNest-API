import { timeCounts } from '@/constants/initialValue';
import { messagesError, messagesSuccess } from '@/constants/messages';
import {
  changePasswordService,
  forgotPassService,
  generateVerifyTokenService,
  getAllUserService,
  getOneUserService,
  updateUserService,
} from '@/services/user.service';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const getAllUser: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.query._sort Param _sort input
   * @param {string} req.query._order Param _order input
   * @param {string} req.query._limit Param _limit input
   * @param {string} req.query._page Param _page input
   * @param {string} req.query._q Param _q input
   */
  const {
    _sort = 'createAt',
    _order = 'asc',
    _limit = '100000',
    _page = '1',
    _q = '',
  } = req.query;
  try {
    const limit = typeof _limit === 'string' ? parseInt(_limit, 10) : 100000;
    const page = typeof _page === 'string' ? parseInt(_page, 10) : 1;

    const sortField = typeof _sort === 'string' ? _sort : 'createAt';
    const options = {
      page: page,
      limit: limit,
      sort: { [sortField]: _order === 'desc' ? -1 : 1 },
      collation: { locale: 'vi', strength: 1 },
    };

    const optionSearch =
      _q !== '' ? { $or: [{ userName: { $regex: _q, $options: 'i' } }] } : {};

    // const users = await User.paginate(optionSearch, options);
    const users = await getAllUserService(optionSearch, options);

    res.status(StatusCodes.OK).json({
      message: 'Get users success',
      data: users.docs,
      total: users.totalDocs,
      limit: users.limit,
      page: users.page,
      totalPages: users.totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const getOneUser: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   */
  const { id } = req.params;
  try {
    const user = await getOneUserService(id);
    res
      .status(StatusCodes.OK)
      .json({ message: messagesSuccess.GET_PROFILE_SUCCESS, res: user });
  } catch (error) {
    next(error);
  }
};

const updateUser: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.params.id Param id input
   * @param {string} req.body.email Param email input
   * @param {string} req.body.password Param password input
   * @param {object} req.body Param body input
   */
  const { id } = req.params;
  const { email, password } = req.body;
  try {
    const newUser = await updateUserService(id, email, password, req.body);
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_USER_SUCCESS,
      res: newUser,
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmailToken: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.verify Param verify input
   */
  const { verify } = req.body;
  try {
    if (!req.cookies.verify || req.cookies.verify !== verify) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }

    const verifyExpired = req.cookies.verify;
    if (Date.now() > verifyExpired) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    res.cookie('exist', req.cookies.verifyExpired);
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CHECK_TOKEN_SUCCESS,
      res: req.cookies.email,
    });
  } catch (error) {
    next(error);
  }
};

const generateVerifyToken: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.email Param email input
   */
  const { email } = req.body;
  try {
    const { verification } = await generateVerifyTokenService(email);

    res.cookie('verify', verification, {
      maxAge: 60 * 60 * 1000,
      httpOnly: true,
    });
    res.cookie(
      'verificationExpire',
      Date.now() + (timeCounts.mins_5 || 5 * 60 * 1000),
      {
        maxAge: 60 * 60 * 1000,
        httpOnly: true,
      },
    );
    res.cookie('email', req.body.email);
    res.status(StatusCodes.OK).json({
      message: 'Send verify token success',
    });
  } catch (error) {
    next(error);
  }
};

const forgotPass: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.email Param email input
   */
  const { email } = req.body;
  try {
    const user = await forgotPassService(email);

    res.clearCookie('email');
    res.clearCookie('verify');
    res.clearCookie('verificationExpire');
    res.clearCookie('exists');
    res.status(StatusCodes.OK).json({
      message: 'Send reset password success !',
      res: user,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword: RequestHandler = async (req, res, next) => {
  /**
   * @param {string} req.body.email Param email input
   * @param {string} req.body.currentPassword Param currentPassword input
   * @param {string} req.body.password Param password input
   */
  const { email, currentPassword, password } = req.body;
  try {
    const user = await changePasswordService(email, currentPassword, password);
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CHANGE_PASSWORD_SUCCESS,
      res: user,
    });
  } catch (error) {
    next(error);
  }
};

export {
  changePassword,
  forgotPass,
  generateVerifyToken,
  getAllUser,
  getOneUser,
  updateUser,
  verifyEmailToken,
};
