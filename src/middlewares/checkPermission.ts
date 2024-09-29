import { messagesError } from '@/constants/messages';
import User from '@/models/User';
import { SECRET_REFRESH_TOKEN } from '@/utils/env';
import { verifyToken } from '@/utils/jwt';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

// const checkPermission = (roles: string[]) => {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     const userRolesIds = req.user.roles || [];
//     const userRoles = await Role.find({ _id: { $in: userRolesIds } });
//     const hasPermission = userRoles.some((roleUser) =>
//       roles.includes(roleUser.name)
//     );

//     console.log(hasPermission);

//     if (!hasPermission) {
//       return res.status(StatusCodes.FORBIDDEN).json({
//         message: messageError.PERMISSION_DENIED,
//       });
//     }
//     next();
//   };
// };
const checkPermission: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: messagesError.FORBIDDEN,
      });
    }
    const decode = verifyToken(token, SECRET_REFRESH_TOKEN) as { _id?: string };
    if (!decode) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: messagesError.TOKEN_INVALID,
      });
    }

    const user = await User.findById(decode._id);
    if (!user) {
      {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: messagesError.FORBIDDEN,
        });
      }
    }
    if (user.role !== 'admin') {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: messagesError.FORBIDDEN,
      });
    }

    req.user = user;
  } catch (error) {
    next(error);
  }
};
export { checkPermission };
