import { sendMailRequest } from '@/controllers/mail.controller';
import validBodyRequest from '@/middlewares/validBodyRequest';
import { mailSchema } from '@/validations/mail.validation';
import { Router } from 'express';

const routeMail = Router();
//* Send mail - Testing feature
routeMail.post(
  '/',
  validBodyRequest(mailSchema),
  // #swagger.tags = ['Mail']
  sendMailRequest,
);
export default routeMail;
