import express from "express";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createFlashcardProgressSchema } from "./flashcardprogress.validation";
import { getFlashcardProgress, reviewFlashcard } from "./flashcardprogress.controller";
import { authGuard } from "../../middleware/auth.middleware";

const router = express.Router();

//why authGuard? Because we want to make sure that only authenticated users can create flashcard progress and view their progress. This ensures that the data is secure and personalized for each user.
router.post("/create-review", authGuard, validateRequest(createFlashcardProgressSchema), reviewFlashcard);
router.get("/my-progress/:topicId", authGuard, getFlashcardProgress);


export const flashcardprogressRoute = router;
