import compression from 'compression';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import router from './routes';

const app = express();
const PORT = process.env.PORT;

//! Init Middleware
app.use(express.json());
app.use(express.urlencoded());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
//! Init Database
import './db/init.mongo.js';
//! Init Route
app.use('/api/v1', router);

app.listen(PORT, () => {
  console.log(`Listen on port ${PORT}`);
});
