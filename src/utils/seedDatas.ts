// import { Types } from 'mongoose';
// import { colors, roles, sizes } from '../constants/initialValue';
// import { PermissionList } from '../interfaces/Permissions';
// // import { Color, Size } from '../models/Product';
// import { Permission, Role } from '../models/User';

// const seedData = async () => {
//   try {
//     const existingRoles = await Role.countDocuments();
//     // const existingSizes = await Size.countDocuments();
//     // const existingColors = await Color.countDocuments();
//     const existingPermissions = await Permission.countDocuments();

//     const createdPermissions: { [key: string]: Types.ObjectId } = {};
//     if (existingPermissions === 0 || existingRoles === 0) {
//       for (const key in PermissionList) {
//         const permissionName =
//           PermissionList[key as keyof typeof PermissionList];

//         let existingPermission = await Permission.findOne({
//           name: permissionName,
//         });
//         if (!existingPermission) {
//           const newPermission = await new Permission({
//             name: permissionName,
//           }).save();
//           createdPermissions[permissionName] = newPermission._id;
//           console.log(`Create permission: ${permissionName}`);
//         } else {
//           createdPermissions[permissionName] = existingPermission._id;
//           console.log(`Permission already exists: ${permissionName}`);
//         }
//       }
//       for (const [roleName, rolePermission] of Object.entries(roles)) {
//         let existingRole = await Role.findOne({ name: roleName });
//         if (!existingRole) {
//           const rolePermissionIds = rolePermission.map(
//             (permission) => createdPermissions[permission]
//           );
//           await new Role({
//             name: roleName,
//             permissions: rolePermissionIds,
//           }).save();
//           console.log(`Created role: ${roleName} `);
//         } else {
//           console.log(`Role already exists: ${roleName} `);
//         }
//       }
//       console.log('Seeding complete');
//     }

//     // Create Permission

//     // if (existingColors === 0) {
//     //   for (const colorName of colors) {
//     //     let existingColor = await Color.findOne({ name: colorName });
//     //     if (!existingColor) {
//     //       await Color.create({ name: colorName });
//     //       console.log(`Created colors: ${colorName} `);
//     //     }
//     //   }
//     // }

//     // // Create size
//     // if (existingSizes === 0) {
//     //   for (const sizeName of sizes) {
//     //     let existingSize = await Size.findOne({ name: sizeName });
//     //     if (!existingSize) {
//     //       await Size.create({ name: sizeName });
//     //       console.log(`Created sizes: ${sizeName} `);
//     //     }
//     //   }
//     // }

//     console.log('Seeding complete');
//   } catch (error) {
//     console.log(error);
//   }
// };

// export { seedData };
