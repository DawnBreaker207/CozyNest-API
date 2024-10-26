import User from '@/models/User';
import {AppError} from '@/utils/errorHandle';
import {StatusCodes} from 'http-status-codes';
import crypto from 'crypto';
import {UserType} from '@/interfaces/User';

const findAllUser = async (optionSearch: object, options: object) => {
    const user = await User.paginate(optionSearch, options);

    if (user.docs.length === 0) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Can not find user');
    }

    return user;
};

const findOneUser = async (id: string): Promise<UserType> => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }
    return user;
};

const findExistUser = async (id: string): Promise<UserType> => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }
    return user;
};

const findEmailExist = async (email: string): Promise<UserType> => {
    const user = await User.findOne({email: email});

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }
    return user;
};

const updateUserInfo = async (
    id: string,
    data: UserType,
): Promise<UserType> => {
    const user = await User.findByIdAndUpdate(id, data);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }
    return user;
};

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

const updateUserPassword = async (
    email: string,
    password: string,
): Promise<UserType> => {
    const user = await User.findOneAndUpdate(
        {email: email},
        {$set: {password: password}},
        {new: true},
    );
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }
    return user;
};

export {
    findAllUser,
    findOneUser,
    findExistUser,
    findEmailExist,
    updateUserInfo,
    generateToken,
    generatePassword,
    updateUserPassword,
};