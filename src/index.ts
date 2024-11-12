import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swagger from 'docs/swagger-output.json';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';
import { Server } from 'socket.io';
import swaggerUI from 'swagger-ui-express';
import redirectPath from './middlewares/redirectPath';
import router from './routes';
import { PORT } from './utils/env';
import { errorHandle, errorHandleNotFound } from './utils/errorHandle';
import logger from './utils/logger';
import { realTime } from './utils/socket';

const app = express();

//* Create server real time
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
//* Create custom logging

const Stream = {
  write: (text: string): void => {
    logger.log('info', text.replace(/\n$/, ''));
  },
};

//* Init Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:4200'],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(helmet());
app.use(compression());
app.use(morgan('dev', { stream: Stream }));

//* Init Database
import '@/db/init.mongo';

//* API Docs
app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swagger));
//* Init Route
app.use('/api/v1', router);

//* Init chat real time
realTime(io);

//* Error Handling
app.use(redirectPath);
app.use(errorHandleNotFound, errorHandle);

server.listen(PORT, () => {
  logger.log('info', `Listen on port ${PORT}`);
});
