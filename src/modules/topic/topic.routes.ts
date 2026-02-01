import express from "express";
import { createTopic, getAllTopic, getSingleTopic, updateTopic, deleteTopic } from "./topic.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createTopicSchema, updateTopicSchema } from "./topic.validation";
import { uploadSingle } from "../../middleware/multer.midleware";

const router = express.Router();

router.post("/create-topic", uploadSingle("image"), validateRequest(createTopicSchema), createTopic);
router.get("/get-topic/:topicId", getSingleTopic);
router.get("/get-all-topic", getAllTopic);
router.patch("/update-topic/:topicId", uploadSingle("image"), validateRequest(updateTopicSchema), updateTopic);
router.delete("/delete-topic/:topicId", deleteTopic);

export default router;
