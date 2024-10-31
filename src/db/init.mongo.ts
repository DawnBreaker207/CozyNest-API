import { URI } from '@/utils/env';
import logger from '@/utils/logger';
import mongoose from 'mongoose';

class Database {
  private static instance: Database | undefined;

  private constructor() {
    this.connect();
  }

  private connect() {
    mongoose.connection.on('connecting', () => {
      logger.log('info', 'MongoDB is connecting...');
    });

    mongoose.connection.on('connected', () => {
      logger.log('info', 'MongoDB connected successfully');
    });

    mongoose.connection.on('disconnecting', () => {
      logger.log('info', 'MongoDB is disconnecting...');
    });

    mongoose.connection.on('disconnected', () => {
      logger.log('info', 'MongoDB disconnected');
    });

    mongoose
      .connect(URI || '')
      .then(() => {
        logger.log('info', `Connect mongoDB success`);
      })
      .catch((err) =>
        logger.log(
          'error',
          `catch errors in database: Error connecting to MongoDB: ${err}`
        )
      );
  }

  public static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }
}

const instanceDB = Database.getInstance();
export default instanceDB;
