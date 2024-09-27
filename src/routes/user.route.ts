import {
  changePassword,
  createUser,
  forgotPass,
  generateVerifyToken,
  getAllUser,
  getOneUser,
  updateUser,
  verifyEmailToken,
} from '@/controllers/user.controller';
import { Router } from 'express';

const routeUser = Router();

routeUser.get('/', getAllUser);
routeUser.get('/:id', getOneUser);
routeUser.post('/', createUser);
routeUser.patch('/:id', updateUser);

routeUser.post('/generateVerificationToken', generateVerifyToken);
routeUser.post('/verifyToken', verifyEmailToken);
routeUser.post('/forgotPassword', forgotPass);
routeUser.post('/changePassword', changePassword);

export default routeUser;
