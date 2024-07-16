import compression from 'compression';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import router from './routes/index';
import { PORT } from './utils/env';
import { errorHandle, errorHandleNotFound } from './utils/errorHandle';

const app = express();

//* Init Middleware
app.use(express.json());
app.use(express.urlencoded());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

//* Init Database
import './db/init.mongo';

//* Init Route
app.use('/api/v1', router);

//* Error Handling
app.use(errorHandleNotFound, errorHandle);

app.listen(PORT, () => {
  console.log(`Listen on port ${PORT}`);
});
