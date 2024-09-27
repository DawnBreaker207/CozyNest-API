import { Login, Register } from '@/controllers/authentication.controller';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { loginSchema, registerSchema } from '@/validations/auth.validation';
import { Router } from 'express';

const routeAuthentication = Router();

routeAuthentication.post(
  '/register',
  validBodyRequest(registerSchema),
  Register
);
routeAuthentication.post('/login', validBodyRequest(loginSchema), Login);

export default routeAuthentication;
