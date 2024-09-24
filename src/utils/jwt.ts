import jwt from 'jsonwebtoken';
import { JWT } from './env';
const createToken = (
  payload: Object,
  SECRET_CODE: string,
  expiresIn = '5m'
) => {
  const token = jwt.sign(payload, SECRET_CODE, {
    expiresIn: expiresIn,
  });
  return token;
};

const verifyToken = (token: string) => {
  return jwt.verify(token, JWT as string);
};
export { createToken, verifyToken };
