import chalk from 'chalk';
import dotenv from 'dotenv';
import { connectDatabase } from './database/db';
import app from './app';
import config from './config';

dotenv.config();

const PORT = config.port ? Number(config.port) : 8000;

connectDatabase()
  .then(() => {
    app.listen(config.port, () => {
      console.log(chalk.green(`Server running at http://localhost:${PORT}`));
    });
  })
  .catch((error: unknown) => {
    console.error(chalk.red('Database connection failed!!'), error);
    process.exit(1);
  });
