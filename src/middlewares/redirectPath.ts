import { RequestHandler } from 'express';

const redirectPath: RequestHandler = (req, res, next) => {
  if (req.path === '/') {
    return res.redirect('/api/v1/products');
  } else if (req.path === '/api/v1') {
    return res.redirect('/api/v1/products');
  }

  next();
};
export default redirectPath;
