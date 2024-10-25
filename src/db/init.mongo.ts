import { URI } from '@/utils/env';
import mongoose from 'mongoose';

class Database {
  private static instance: Database | undefined;

  private constructor() {
    this.connect();
  }

  private connect() {
    mongoose.connection.on('connecting', () => {
      console.log('MongoDB is connecting...');
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    mongoose.connection.on('disconnecting', () => {
      console.log('MongoDB is disconnecting...');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose
      .connect(URI || '')
      .then(() => {
        console.log(`Connect mongoDB success`);
      })
      .catch((err) => console.log(`Error connecting to MongoDB: ${err}`));
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
