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
    mongoose
      .connect(URI || '')
      .then((_) => {
        console.log(`Connect DB success`);
        // return seedData();
      })
      .catch((err) => console.log(`Error Connect ${err}`));
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
