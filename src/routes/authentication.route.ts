import { Router } from 'express';

import validBodyRequest from '../middlewares/validBodyRequest';
import { loginSchema, registerSchema } from '../validations/auth.validation';
import {
  Forgot_Pass,
  Login,
  Register,
} from '../controllers/authentication.controller';

const routeAuthentication = Router();

routeAuthentication.post(
  '/register',
  validBodyRequest(registerSchema),
  Register
);
routeAuthentication.post('/login', validBodyRequest(loginSchema), Login);
routeAuthentication.post('/forgot-password', Forgot_Pass);

export default routeAuthentication;
