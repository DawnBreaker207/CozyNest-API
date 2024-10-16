import { URI } from '@/utils/env';
import mongoose from 'mongoose';
// import { seedData } from '../utils/seedDatas';

// const URI: dot = process.env.URI;
// const connectDB = async (URI: string | undefined) => {
//   try {
//     await mongoose.connect(URI || '');
//     console.log('Connect DB success');
//     await seedData();
//   } catch (error) {
//     console.log(error);
//   }
// };
// const instanceDB = connectDB(URI);
// export default instanceDB;

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
        // return seedData();
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
