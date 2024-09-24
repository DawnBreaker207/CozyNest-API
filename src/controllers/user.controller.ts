import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { messageError, messagesSuccess } from '../constants/messages';
import { User } from '../models/User';
import { sendMail } from '../utils/sendMail';
import { hashPassword } from '../utils/hashPassword';

// TODO CRUD user, forget password ,verify token , change password
// const getAllUser: RequestHandler = async (req, res, next) => {
//   try {
    

//   const {
//     _sort = 'createAt',
//     _order = 'asc',
//     _limit = 100000,
//     _page = 1,
//     _q = '',
//   } = req.query;
//   const options = {
//     page: _page,
//     sort: { [_sort]: _order === 'desc' ? -1 : 1 },
//     collation: { locate: 'vi', strength: 1 },
//   };

//   if (_limit !== undefined) {
//     options.limit = _limit;
//   }
//   const optionSearch = _q !== '' ? {$or: [userName:{$regexp: _q,$option: 'i'}]}:{}

//   const users = await User.paginate({...optionSearch},{...options});

//   if(users.docs.length === 0){
//     return res.status(StatusCodes.BAD_REQUEST).json({
//       message: messageError.BAD_REQUEST
//     })
//   }
// } catch (error) {
//     next(error)
// }
// };

const getOneUser: RequestHandler = async (req, res, next) => {
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

const createUser: RequestHandler = async (req, res, next) => {

};
const updateUser: RequestHandler = async (req, res, next) => {};

// Check mail & Verify token from email
const verifyToken: RequestHandler = async (req, res, next) => {};

const generateVerifyToken: RequestHandler = async (req, res, next) => {};

const Forgot_Pass: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body;
    const findUser = await User.findOne({ email });

    if (!findUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messageError.BAD_REQUEST,
      });
    }
    const newPassword = Math.random().toString(36).slice(-8);
    const hashPass = await hashPassword(newPassword);
    if (!hashPass) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: messageError.ERROR_SERVER,
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

const changePassword:RequestHandler = async (req,res,next) =>{
  try {
    
  } catch (error) {
    next(error)
  }
}
export { getOneUser, Forgot_Pass };
