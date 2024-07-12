import { Router } from 'express';
import AuthenticationController from '../controllers/Authentication.controllers';

const routeAuthentication = Router();
const authenticationController = new AuthenticationController();

routeAuthentication.post('/register', authenticationController.register);
routeAuthentication.post('/login', authenticationController.login);

export default routeAuthentication;
