import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();
import { connectDatabase } from "./database/db";
import app from "./app";
import config from "./config/index";
import "./config/redis";
import { startPingServerCron } from "./database/serverUp.corn";

const PORT = config.port ? Number(config.port) : 8000;

connectDatabase()
  .then(() => {
    app.listen(config.port, () => {
      console.log(chalk.green(`Server running at http://localhost:${PORT}`));
    });
  }).then(() => {
    if (config.env === "development") {
      startPingServerCron();
    }
  })
  .catch((error: unknown) => {
    console.error(chalk.red("Database connection failed!!"), error);
    process.exit(1);
  });
