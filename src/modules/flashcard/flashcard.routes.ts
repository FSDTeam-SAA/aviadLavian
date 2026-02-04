import express from "express";
import { createFlashcard } from "./flashcard.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createFlashcardSchema } from "./flashcard.validation";
import { uploadSingle } from "../../middleware/multer.midleware";

const router = express.Router();

//TODO: customize as needed

//router.post("/create-flashcard", uploadSingle("image"), validateRequest(createFlashcardSchema), createFlashcard);

export default router;
