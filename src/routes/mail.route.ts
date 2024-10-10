import { sendMailRequest } from '@/controllers/mail.controller';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { mailSchema } from '@/validations/mail.validation';
import { Router } from 'express';

const routeMail = Router();
routeMail.post('/', validBodyRequest(mailSchema), sendMailRequest);
export default routeMail;