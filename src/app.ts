import express, { Request, Response } from "express";

import routes from "./routes/index.api";
import { globalErrorHandler } from "./helpers/globalErrorHandler";
import {
  serverLiveEmailTemplate,
  ServerLiveEmailTemplateProps,
} from "./tempaletes/serverlive.template";
import config from "./config";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";

const app = express();

if (config.env === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("short"));
}

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", routes);

app.get("/", (req: Request, res: Response) => {
  const serverInfo: ServerLiveEmailTemplateProps = {
    appName: "Virus Computer API",
    environment: config.env,
    liveUrl: "https://staging.viruscomputer.com",
  };
  res.send(serverLiveEmailTemplate(serverInfo));
});

//global error handler
app.use(globalErrorHandler);

export default app;
