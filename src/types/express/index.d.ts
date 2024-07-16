import { Request } from 'express';
import { UserType } from '../../interfaces/User';
declare global {
  namespace Express {
    export interface Request {
      user: UserType;
    }
  }
}
