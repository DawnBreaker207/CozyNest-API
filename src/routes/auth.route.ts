import {
  Login,
  Register,
  checkRefreshToken,
  clearToken,
} from '@/controllers/auth.controller';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { loginSchema, registerSchema } from '@/validations/auth.validation';
import { Router } from 'express';

const routeAuth = Router();

//* Register new account
routeAuth.post(
  '/register',
  validBodyRequest(registerSchema),
  // #swagger.tags = ['Authentication']
  Register,
);

//* Login exist account
routeAuth.post(
  '/login',
  validBodyRequest(loginSchema),
  // #swagger.tags = ['Authentication']
  Login,
);

//* Get refresh token
routeAuth.get(
  '/token',
  // #swagger.tags = ['Authentication']
  checkRefreshToken,
);

//* Clear token = log out
routeAuth.delete(
  '/token',
  // #swagger.tags = ['Authentication']
  clearToken,
);

export default routeAuth;
