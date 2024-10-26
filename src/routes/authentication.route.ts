import {
  checkRefreshToken,
  clearToken,
  Login,
  Register,
} from '@/controllers/auth.controller';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { loginSchema, registerSchema } from '@/validations/auth.validation';
import { Router } from 'express';

const routeAuthentication = Router();
//* Register new account
routeAuthentication.post(
  '/register',
  validBodyRequest(registerSchema),
  Register
);

//* Login exist account
routeAuthentication.post('/login', validBodyRequest(loginSchema), Login);

//* Get refresh token
routeAuthentication.get('/token', checkRefreshToken);

//* Clear token = log out
routeAuthentication.delete('/token', clearToken);

export default routeAuthentication;
