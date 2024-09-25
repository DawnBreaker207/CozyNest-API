import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { messagesError, messagesSuccess } from '../constants/messages';
import { User } from '../models/User';
import { sendMail } from '../utils/sendMail';
import { comparePassword, hashPassword } from '../utils/hashPassword';
import mongoosePaginate from 'mongoose-paginate-v2';
import crypto from 'crypto';
// TODO CRUD user, forget password ,verify token , change password
// const getAllUser: RequestHandler = async (req, res, next) => {
//   try {
//     const {
//       _sort = 'createAt',
//       _order = 'asc',
//       _limit = '100000',
//       _page = '1',
//       _q = '',
//     } = req.query;
//     const sortField = typeof _sort === 'string' ? _sort : 'createAt';
//     const options = {
//       page: _page,
//       limit: _limit,
//       sort: { [sortField]: _order === 'desc' ? -1 : 1 },
//       collation: { locate: 'vi', strength: 1 },
//     };

//     if (_limit !== undefined) {
//       options.limit = _limit;
//     }
//     const optionSearch =
//       _q !== '' ? { $or: [{ userName: { $regex: _q, $options: 'i' } }] } : {};

//     const users = await User.paginate({ ...optionSearch }, { ...options });

//     if (users.docs.length === 0) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         message: messagesError.BAD_REQUEST,
//       });
//     }
//   } catch (error) {
//     next(error);
//   }
// };

const getOneUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
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

const createUser: RequestHandler = async (req, res, next) => {
  try {
    const hashPass = await hashPassword(req.body.password);

    const user = await User.create({
      ...req.body,
      password: hashPass,
    });
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
    return res.status(StatusCodes.OK).json({
      message: messagesSuccess.CREATE_USER_SUCCESS,
      res: user,
    });
  } catch (error) {
    next(error);
  }
};
const updateUser: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.BAD_REQUEST,
      });
    }
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

// Check mail & Verify token from email
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

// const generateVerifyToken: RequestHandler = async (req, res, next) => {
//   const emailExist = await User.findOne({ email: req.body.email });
//   if (!emailExist) {
//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       message: messagesError.EMAIL_NOT_FOUND,
//     });
//   }
//   const verification = crypto.randomBytes(3).toString('hex');
//   const verificationExpire = 5 * 60 * 1000; //Expire in 5 min
//   const mailOptions  = {

//   }

// };

const Forgot_Pass: RequestHandler = async (req, res, next) => {
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
    findUser.password = hashPass;
    const emailSubject = 'Password reset from CozyNest';
    const emailText = `Your new password is ${newPassword}`;
    await sendMail(email, emailSubject, emailText);
  } catch (error) {
    next(error);
  }
};

const changePassword: RequestHandler = async (req, res, next) => {
  try {
    const { currentPassword, password } = req.body;

    const userExist = await User.findById(req.user._id);

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
    const user = await User.findByIdAndUpdate(req.user._id, {
      password: hashPass,
    });
    res.status(StatusCodes.OK).json({
      message: messagesSuccess.CHANGE_PASSWORD_SUCCESS,
      res: user,
    });
  } catch (error) {
    next(error);
  }
};
export {
  getOneUser,
  Forgot_Pass,
  changePassword,
  verifyEmailToken,
  createUser,
  updateUser,
};
