import express from "express";
import { createTopic } from "./topic.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createTopicSchema } from "./topic.validation";
import { uploadSingle } from "../../middleware/multer.midleware";

const router = express.Router();

//TODO: customize as needed

router.post("/create-topic", uploadSingle("image"), validateRequest(createTopicSchema), createTopic);

export default router;
