import mongoose from 'mongoose';
import chalk from 'chalk';
import dotenv from 'dotenv';
import config from '../config';

dotenv.config();

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUrl = config.mongoUri;

    if (!mongoUrl) {
      throw new Error('MONGODB_URL is not defined in environment variables');
    }

    const dbinfo = await mongoose.connect(mongoUrl);

    console.log(
      chalk.yellow(`Database connection successful: ${dbinfo.connection.host}`),
    );
  } catch (error) {
    console.error(chalk.red('Database connection failed!!'), error);
    process.exit(1); // stop app if DB fails
  }
};
