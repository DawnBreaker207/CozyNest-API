import { Server } from '@/socket.io/dist';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';
import redirectPath from './middlewares/redirectPath';
import router from './routes';
import { PORT } from './utils/env';
import { errorHandle, errorHandleNotFound } from './utils/errorHandle';
import { realTime } from './utils/socket';

const app = express();
//* Create server real time
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

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

//* Init chat real time
realTime(io);
//* Init Route
app.use('/api/v1', router);

//* Error Handling
app.use(errorHandleNotFound, errorHandle);

server.listen(PORT, () => {
  console.log(`Listen on port ${PORT}`);
});
