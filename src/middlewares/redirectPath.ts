import { RequestHandler } from 'express';

const redirectPath: RequestHandler = (req, res, next) => {
  if (req.path === '/') {
    return res.redirect('/api/docs');
  } else if (req.path === '/api/v1') {
    return res.redirect('/api/docs');
  }

  next();
};
export default redirectPath;
