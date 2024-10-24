import { configSendMail } from '@/configs/configMail';
import { timeCounts } from '@/constants/initialValue';
import { messagesError, messagesSuccess } from '@/constants/messages';
import User from '@/models/User';
import { comparePassword, hashPassword } from '@/utils/hashPassword';
import { sendResetMail, sendVerifyMail } from '@/utils/texts';
import crypto from 'crypto';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

const getAllUser: RequestHandler = async (req, res, next) => {
  try {
    const {
      _sort = 'createAt',
      _order = 'asc',
      _limit = '100000',
      _page = '1',
      _q = '',
    } = req.query;

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

    const users = await User.paginate(optionSearch, options);

    if (users.docs.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
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
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    res
      .status(StatusCodes.OK)
      .json({ message: messagesSuccess.GET_PROFILE_SUCCESS, res: user });
  } catch (error) {
    next(error);
  }
};

const updateUser: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Check user exist
    const user = await User.findById(id);
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    // Check email exist
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist && !emailExist._id.equals(user.id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }

    if (req.body.password || req.body.password != null) {
      req.body.password = await hashPassword(req.body.password);
    }
    const newUser = await User.findByIdAndUpdate(id, req.body);
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.UPDATE_USER_SUCCESS,
      res: newUser,
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmailToken: RequestHandler = async (req, res, next) => {
  try {
    const { verify } = req.body;

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
  try {
    const emailExist = await User.findOne({ email: req.body.email });
    if (!emailExist) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: messagesError.EMAIL_NOT_FOUND,
      });
    }

    const verification = crypto.randomBytes(3).toString('hex');
    if (!verification) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: messagesError.NOT_FOUND,
      });
    }

    await configSendMail({
      email: req.body.email,
      subject: 'CozyNest - Forget password',
      text: sendVerifyMail('CozyNest - Forget password', verification),
    });

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
      }
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
  try {
    const { email } = req.body;

    const findUser = await User.findOne({ email });
    if (!findUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }

    const newPassword = Math.random().toString(36).slice(-8);

    const hashPass = await hashPassword(newPassword);
    if (!hashPass) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: messagesError.ERROR_SERVER,
      });
    }

    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { password: hashPass } },
      { new: true }
    );
    if (!user) {
      return res.status(StatusCodes.BAD_GATEWAY).json({
        message: messagesError.BAD_GATEWAY,
      });
    }

    await configSendMail({
      email: email,
      subject: 'Password reset from CozyNest',
      text: sendResetMail('Password reset from CozyNest', newPassword),
    });

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
  try {
    const { email, currentPassword, password } = req.body;

    const userExist = await User.findOne({ email: email });

    const passwordExist = await comparePassword(
      currentPassword,
      userExist?.password as string
    );
    if (!passwordExist) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    const hashPass = await hashPassword(password);
    const user = await User.findOneAndUpdate(
      { email: email },
      {
        password: hashPass,
      }
    );
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
