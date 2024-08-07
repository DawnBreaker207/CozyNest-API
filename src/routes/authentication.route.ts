import { Router } from 'express';
import {
  Forgot_Pass,
  Login,
  Register,
} from '../controllers/authentication.controllers';
import validBodyRequest from '../middlewares/validBodyRequest';
import { loginSchema, registerSchema } from '../validations/auth.validation';

const routeAuthentication = Router();

routeAuthentication.post(
  '/register',
  validBodyRequest(registerSchema),
  Register
);
routeAuthentication.post('/login', validBodyRequest(loginSchema), Login);
routeAuthentication.post('/forgot-password', Forgot_Pass);

export default routeAuthentication;
