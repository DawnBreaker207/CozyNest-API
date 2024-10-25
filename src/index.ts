import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import redirectPath from './middlewares/redirectPath';
import router from './routes';
import { PORT } from './utils/env';
import { errorHandle, errorHandleNotFound } from './utils/errorHandle';

const app = express();
//* Init Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
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
import '@/db/init.mongo';

//* Init Route
app.use('/api/v1', router);

//* Error Handling
app.use(errorHandleNotFound, errorHandle);

app.listen(PORT, () => {
  console.log(`Listen on port ${PORT}`);
});

// TODO: Refactor code, split controller to service and controller
// TODO: Add check style to code base, ESlint and Prettier
