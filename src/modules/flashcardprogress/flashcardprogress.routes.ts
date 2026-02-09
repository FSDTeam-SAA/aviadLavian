import express from "express";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createFlashcardProgressSchema } from "./flashcardprogress.validation";
import { reviewFlashcard } from "./flashcardprogress.controller";
import { authGuard } from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/create-review", authGuard, validateRequest(createFlashcardProgressSchema), reviewFlashcard);

export default router;
