import compression from 'compression';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import router from './routes/index';
import { PORT } from './utils/env';
import { errorHandle, errorHandleNotFound } from './utils/errorHandle';
import cors from 'cors';

const app = express();
//* Init Middleware
app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(redirectPath);
//* Init Database
import './db/init.mongo';
import redirectPath from './middlewares/redirectPath';

//* Init Route
app.use('/api/v1', router);

//* Error Handling
app.use(errorHandleNotFound, errorHandle);

app.listen(PORT, () => {
  console.log(`Listen on port ${PORT}`);
});
