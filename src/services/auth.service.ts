import { messagesError } from '@/constants/messages';
import { StatusCodes } from '@/http-status-codes/build/cjs';
import { UserType } from '@/interfaces/User';
import User from '@/models/User';
import { SECRET_REFRESH_TOKEN } from '@/utils/env';
import { AppError } from '@/utils/errorHandle';
import { comparePassword, hashPassword } from '@/utils/hashPassword';
import { verifyToken } from '@/utils/jwt';
import logger from '@/utils/logger';

const registerService = async (
    email: string,
    password: string,
    input: UserType,
  ): Promise<UserType> => {
    const checkEmail = await User.findOne({ email });

    // Check if email exist in database
    if (checkEmail) {
      logger.log('error', 'Email exist in register');
      throw new AppError(StatusCodes.BAD_REQUEST, messagesError.EMAIL_EXIST);
    }

    const hashPass = await hashPassword(password as string),
      newUser = await User.create({
        ...input,
        password: hashPass,
        roles: 'member',
      });

    if (!newUser) {
      logger.log('error', 'User is not unauthorized in register');
      throw new AppError(StatusCodes.UNAUTHORIZED, messagesError.UNAUTHORIZED);
    }
    newUser.password = undefined;
    return newUser;
  },
  loginService = async (email: string, password: string): Promise<UserType> => {
    const userExist = await User.findOne({ email });
    //Check user exist
    if (!userExist) {
      logger.log('error', 'User is not existed in login');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        messagesError.EMAIL_NOT_FOUND,
      );
    }

    // If user status = false, return forbidden
    if (!userExist.status) {
      logger.log('error', 'User status is forbidden in login');
      throw new AppError(StatusCodes.FORBIDDEN, messagesError.FORBIDDEN);
    }

    // Check password valid
    if (
      !(await comparePassword(password as string, userExist.password as string))
    ) {
      logger.log('error', 'User password is wrong in login');
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        messagesError.INVALID_PASSWORD,
      );
    }
    userExist.password = undefined;
    return userExist;
  },
  checkTokenService = async (refreshToken: string): Promise<UserType> => {
    // If refresh token exist, verify it
    const decoded = verifyToken(refreshToken, SECRET_REFRESH_TOKEN as string);
    if (!decoded) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid token');
    }
    const { _id } = decoded as unknown as { _id: string },
      user = await User.findById(_id);

    // If user not exist, return error
    if (!user) {
      logger.log('error', 'User is not found in check token');
      throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }
    return user;
  };
export { checkTokenService, loginService, registerService };
