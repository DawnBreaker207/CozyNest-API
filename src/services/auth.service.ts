import { messagesError } from '@/constants/messages';
import { StatusCodes } from '@/http-status-codes/build/cjs';
import { UserType } from '@/interfaces/User';
import User from '@/models/User';
import { SECRET_REFRESH_TOKEN } from '@/utils/env';
import { AppError } from '@/utils/errorHandle';
import { comparePassword, hashPassword } from '@/utils/hashPassword';
import { verifyToken } from '@/utils/jwt';

const registerService = async (input: UserType): Promise<UserType> => {
  const { email, password } = input;
  const checkEmail = await User.findOne({ email });

  // Check if email exist in database
  if (checkEmail) {
    throw new AppError(StatusCodes.BAD_REQUEST, messagesError.EMAIL_EXIST);
  }

  const hashPass = await hashPassword(password as string);

  const newUser = await User.create({
    ...input,
    password: hashPass,
    roles: 'member',
  });

  if (!newUser) {
    throw new AppError(StatusCodes.UNAUTHORIZED, messagesError.UNAUTHORIZED);
  }
  newUser.password = undefined;
  return newUser;
};

const loginService = async (input: UserType): Promise<UserType> => {
  const { email, password } = input;

  const userExist = await User.findOne({ email });
  //Check user exist
  if (!userExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, messagesError.EMAIL_NOT_FOUND);
  }

  // If user status = false, return forbidden
  if (!userExist.status) {
    throw new AppError(StatusCodes.FORBIDDEN, messagesError.FORBIDDEN);
  }

  // Check password valid
  if (
    !(await comparePassword(password as string, userExist.password as string))
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, messagesError.INVALID_PASSWORD);
  }
  userExist.password = undefined;
  return userExist;
};

const checkTokenService = async (refreshToken: string): Promise<UserType> => {
  // If refresh token exist, verify it
  const decoded = verifyToken(refreshToken, SECRET_REFRESH_TOKEN as string);
  if (decoded) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid token');
  }
  const { _id } = decoded as { _id: string };
  const user = await User.findById(_id);

  // If user not exist, return error
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return user;
};
export { checkTokenService, loginService, registerService };
