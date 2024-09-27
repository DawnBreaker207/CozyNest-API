// import { NextFunction, Request, Response } from 'express';
// import { StatusCodes } from 'http-status-codes';
// import { messageError } from '../constants/messages';
// import { Role } from '../models/User';

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

// export { checkPermission };
