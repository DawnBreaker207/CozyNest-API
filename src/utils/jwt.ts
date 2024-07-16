import jwt from 'jsonwebtoken';
import { JWT } from './env';
const createToken = (payload: Object, expiresIn = '10d') => {
  const token = jwt.sign(payload, JWT as string, { expiresIn: expiresIn });
  return token;
};

const verifyToken = (token: string) => {
  return jwt.verify(token, JWT as string);
};
export { createToken, verifyToken };
