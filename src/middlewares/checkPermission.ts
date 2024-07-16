import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { messageError } from '../constants/messages';
import { roles } from '../constants/permission';
import { PermissionList } from '../interfaces/Permissions';
import { Permission, Role } from '../models/User';

const checkPermission = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRolesIds = req.user.roles || [];

    const userRoles = await Role.find({ _id: { $in: userRolesIds } });

    const hasPermission = userRoles.some((roleUser) =>
      roles.includes(roleUser.name)
    );

    if (!hasPermission) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: messageError.PERMISSION_DENIED,
      });
    }
    next();
  };
};

const seedPermissionAndRole = async () => {
  try {
    const existingPermissions = await Permission.countDocuments();
    const existingRoles = await Role.countDocuments();

    if (existingPermissions > 0 || existingRoles > 0) {
      return;
    }
    
    // Create Permission
    const createdPermissions: { [key: string]: Types.ObjectId } = {};
    for (const key in PermissionList) {
      const permissionName = PermissionList[key as keyof typeof PermissionList];
      console.log(permissionName);

      let existingPermission = await Permission.findOne({
        name: permissionName,
      });
      if (!existingPermission) {
        const newPermission = await new Permission({
          name: permissionName,
        }).save();
        createdPermissions[permissionName] = newPermission._id;
        console.log(`Create permission: ${permissionName}`);
      } else {
        createdPermissions[permissionName] = existingPermission._id;
        console.log(`Permission already exists: ${permissionName}`);
      }
    }
    // Create Roles
    for (const [roleName, rolePermission] of Object.entries(roles)) {
      let existingRole = await Role.findOne({ name: roleName });
      if (!existingRole) {
        const rolePermissionIds = rolePermission.map(
          (permission) => createdPermissions[permission]
        );
        await new Role({
          name: roleName,
          permissions: rolePermissionIds,
        }).save();
        console.log(`Created role: ${roleName} `);
      } else {
        console.log(`Role already exists: ${roleName} `);
      }
    }
    console.log('Seeding complete');
  } catch (error) {
    console.log(error);
  }
};
export { checkPermission, seedPermissionAndRole };
