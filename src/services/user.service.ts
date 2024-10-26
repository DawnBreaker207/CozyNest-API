import User from '@/models/User';
import { AppError } from '@/utils/errorHandle';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import { UserType } from '@/interfaces/User';
import { comparePassword, hashPassword } from '@/utils/hashPassword';
import { sendResetMail, sendVerifyMail } from '@/utils/texts';
import { configSendMail } from '@/configs/configMail';
const generateToken = (): string => {
  const token = crypto.randomBytes(3).toString('hex');
  if (!token) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There some error when create token',
    );
  }
  return token;
};

const generatePassword = (): string => {
  const password = Math.random().toString(36).slice(-8);
  if (!password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There some error when create password',
    );
  }
  return password;
};

const getAllUserService = async (optionSearch: object, options: object) => {
  const user = await User.paginate(optionSearch, options);

  if (user.docs.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Can not find user');
  }

  return user;
};

const getOneUserService = async (id: string): Promise<UserType> => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return user;
};

const updateUserService = async (
  id: string,
  email: string,
  password: string,
  input: UserType,
) => {
  // Check user exist
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Not found user');
  }
  // Check email exist
  const emailExist = await User.findOne({ email: email });
  if (emailExist && !emailExist._id.equals(user.id)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Email exist');
  }

  if (password || password != null) {
    password = await hashPassword(password);
  }
  const newUser = await User.findByIdAndUpdate(id, input);
  if (!newUser) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Something is wrong when update user',
    );
  }
  return newUser;
};

const generateVerifyTokenService = async (email: string) => {
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  const verification = generateToken();

  await configSendMail({
    email: email,
    subject: 'CozyNest - Forget password',
    text: sendVerifyMail('CozyNest - Forget password', verification),
  });
  return { user, verification };
};

const forgotPassService = async (email: string) => {
  const findUser = await User.findOne({ email });
  if (!findUser) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const newPassword = generatePassword();

  const hashPass = await hashPassword(newPassword);
  if (!hashPass) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Problem when hashing password',
    );
  }

  const user = await User.findOneAndUpdate(
    { email: email },
    { $set: { password: hashPass } },
    { new: true },
  );
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  await configSendMail({
    email: email,
    subject: 'Password reset from CozyNest',
    text: sendResetMail('Password reset from CozyNest', newPassword),
  });
  return user;
};

const changePasswordService = async (
  email: string,
  currentPassword: string,
  password: string,
) => {
  const userExist = await User.findOne({ email: email });

  const passwordExist = await comparePassword(
    currentPassword,
    userExist?.password as string,
  );
  if (!passwordExist) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'There something wrong when compare password',
    );
  }
  const hashPass = await hashPassword(password);
  const user = await User.findOneAndUpdate(
    { email: email },
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
  forgotPassService,
  changePasswordService,
};
