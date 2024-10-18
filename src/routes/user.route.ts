import {
  changePassword,
  forgotPass,
  generateVerifyToken,
  getAllUser,
  getOneUser,
  updateUser,
  verifyEmailToken,
} from '@/controllers/user.controller';
import { Router } from 'express';

const routeUser = Router();
//* Get all users exist
routeUser.get('/', getAllUser);

//* Get one user
routeUser.get('/:id', getOneUser);

//* Update user
routeUser.patch('/:id', updateUser);

//* Generate verify token form user
routeUser.post('/generateVerificationToken', generateVerifyToken);

//* Verify token from email sending
routeUser.post('/verifyToken', verifyEmailToken);

//* Forgot password
routeUser.post('/forgotPassword', forgotPass);

//* Change password
routeUser.post('/changePassword', changePassword);

export default routeUser;
