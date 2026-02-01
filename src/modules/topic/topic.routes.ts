import express from "express";
import { createTopic, getAllTopic, getSingleTopic, updateTopic, deleteTopic } from "./topic.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createTopicSchema, updateTopicSchema } from "./topic.validation";
import { uploadSingle } from "../../middleware/multer.midleware";
import { allowRole, authGuard } from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/create-topic", authGuard, allowRole("admin"), uploadSingle("image"), validateRequest(createTopicSchema), createTopic);
router.get("/get-topic/:topicId", getSingleTopic);
router.get("/get-all-topic", authGuard, allowRole("admin", "user"), getAllTopic);
router.patch("/update-topic/:topicId", authGuard, allowRole("admin"), uploadSingle("image"), validateRequest(updateTopicSchema), updateTopic);
router.delete("/delete-topic/:topicId", authGuard, allowRole("admin"), deleteTopic);

export default router;
