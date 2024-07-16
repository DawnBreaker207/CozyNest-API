import { Router } from 'express';
import { Login, Register } from '../controllers/Authentication.controllers';
import validBodyRequest from '../middlewares/validBodyRequest';
import { loginSchema, registerSchema } from '../validations/auth.validation';

const routeAuthentication = Router();

routeAuthentication.post(
  '/register',
  validBodyRequest(registerSchema),
  Register
);
routeAuthentication.post('/login', validBodyRequest(loginSchema), Login);

export default routeAuthentication;
