import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import User from '../models/User';
import { RequestHandler } from 'express';

interface User {
  email: string;
  password: string;
}

class AuthenticationController {
  register: RequestHandler = async (req, res) => {
    try {
      const { email, password } = req.body;
      const hash = bcrypt.genSaltSync(parseFloat(process.env.SALT || ''));
      const crypt = bcrypt.hashSync(password, hash);

      const user = {
        email: email,
        password: crypt,
      };

      const data = await User.create(user);
      const token = jwt.sign({ data }, process.env.JWT || '', {
        expiresIn: '1d',
      });
      res.status(200).json({
        data: data,
        token: token,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };
  login: RequestHandler = async (req, res) => {
    try {
      const { email, password } = req.body;

      const data: User | any = await User.findOne({ email: email });

      const check = bcrypt.compareSync(password, data.password);
      if (check) {
        const token = jwt.sign({ data }, process.env.JWT || '', {
          expiresIn: '1d',
        });
        res.status(200).json({ token: token });
      }
    } catch (error) {
      res.status(500).json(error);
    }
  };
}
export default AuthenticationController;
