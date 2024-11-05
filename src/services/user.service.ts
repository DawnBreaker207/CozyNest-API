import User from '@/models/User';
import { AppError } from '@/utils/errorHandle';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import { UserType } from '@/interfaces/User';
import { comparePassword, hashPassword } from '@/utils/hashPassword';
import { sendResetMail, sendVerifyMail } from '@/utils/texts';
import { configSendMail } from '@/configs/configMail';
import logger from '@/utils/logger';

const generateToken = (): string => crypto.randomBytes(3).toString('hex'),
  generatePassword = (): string => Math.random().toString(36).slice(-8),
  getAllUserService = async (optionSearch: object, options: object) => {
    const user = await User.paginate(optionSearch, options);

    if (user.docs.length === 0) {
      logger.log('error', 'User not found in get all user');
      throw new AppError(StatusCodes.BAD_REQUEST, 'Can not find user');
    }

    return user;
  },
  getOneUserService = async (id: string): Promise<UserType> => {
    const user = await User.findById(id);
    if (!user) {
      logger.log('error', 'User not found in get one user');
      throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }
    return user;
  },
  updateUserService = async (
    id: string,
    email: string,
    password: string,
    input: UserType,
  ) => {
    // Check user exist
    const user = await User.findById(id);
    if (!user) {
      logger.log('error', 'User not found in update user');
      throw new AppError(StatusCodes.NOT_FOUND, 'Not found user');
    }
    // Check email exist
    const emailExist = await User.findOne({ email });
    if (emailExist && !emailExist._id.equals(user.id)) {
      logger.log('error', 'Email exist in get one user');
      throw new AppError(StatusCodes.BAD_REQUEST, 'Email exist');
    }

    if (password || password != null) {
      password = await hashPassword(password);
    }
    const newUser = await User.findByIdAndUpdate(id, input);
    if (!newUser) {
      logger.log('error', 'User update failed in get update user');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Something is wrong when update user',
      );
    }
    return newUser;
  },
  generateVerifyTokenService = async (email: string) => {
    const user = await User.findOne({ email });
    if (!user) {
      logger.log('error', 'User not found in generate verify token');
      throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }
    const verification = generateToken();

    await configSendMail({
      email,
      subject: 'CozyNest - Forget password',
      text: sendVerifyMail('CozyNest - Forget password', verification),
    });
    return { user, verification };
  },
  forgotPasswordService = async (email: string) => {
    const findUser = await User.findOne({ email });
    if (!findUser) {
      logger.log('error', 'User not found in forgot pass');
      throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    const newPassword = generatePassword(),
      hashPass = await hashPassword(newPassword);
    if (!hashPass) {
      logger.log(
        'error',
        'Problem when hashing password in generate forgot pass',
      );
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Problem when hashing password',
      );
    }

    const user = await User.findOneAndUpdate(
      { email },
      { $set: { password: hashPass } },
      { new: true },
    );
    if (!user) {
      logger.log('error', 'User update failed in forgot pass');
      throw new AppError(StatusCodes.NOT_FOUND, 'User update failed');
    }

    await configSendMail({
      email,
      subject: 'Password reset from CozyNest',
      text: sendResetMail('Password reset from CozyNest', newPassword),
    });
    return user;
  },
  changePasswordService = async (
    email: string,
    currentPassword: string,
    password: string,
  ) => {
    const userExist = await User.findOne({ email }),
      passwordExist = await comparePassword(
        currentPassword,
        userExist?.password as string,
      );
    if (!passwordExist) {
      logger.log('error', 'Compare password failed in change password');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'There something wrong when compare password',
      );
    }
    const hashPass = await hashPassword(password),
      user = await User.findOneAndUpdate(
        { email },
        {
          password: hashPass,
        },
      );
    return user;
  };

export {
  getAllUserService,
  getOneUserService,
  updateUserService,
  generateToken,
  generatePassword,
  generateVerifyTokenService,
  forgotPasswordService,
  changePasswordService,
};