import moment from 'moment';
import winston, { exitOnError } from 'winston';
const { transports, format, createLogger } = winston;
const { combine, printf } = format;

const customLog = printf(({ level, message }) => {
  const logTime = moment().format('YYYY-MM-DD HH:mm:ss');
  return `Level: [${level}] LogTime [${logTime}] Message: -[${message}]`;
});
const logger = createLogger({
  level: 'info',
  format: combine(customLog),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      level: 'error',
      dirname: 'logs',
      handleExceptions: true,
      filename: 'combine.log',
    }),
  ],
  exitOnError: false,
});
export default logger;
