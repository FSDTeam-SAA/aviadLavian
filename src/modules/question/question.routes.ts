import express from "express";
import { createQuestion } from "./question.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createQuestionSchema } from "./question.validation";
import { uploadSingle } from "../../middleware/multer.midleware";

const router = express.Router();

//TODO: customize as needed

//router.post("/create-question", uploadSingle("image"), validateRequest(createQuestionSchema), createQuestion);

export default router;
