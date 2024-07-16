import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const { PORT, URI, SALT, JWT } = process.env;
export { PORT, URI, SALT, JWT };
