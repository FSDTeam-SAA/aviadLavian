import express from "express";
import { createFlashcard, deleteFlashcard, getAllFlashcards, getFlashcard, updateFlashcard } from "./flashcard.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createFlashcardSchema, updateFlashcardSchema } from "./flashcard.validation";
import { upload } from "../../middleware/multer.midleware";
import { allowRole, authGuard } from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/create-flashcard", authGuard, allowRole("admin"), upload.single("image"), validateRequest(createFlashcardSchema), createFlashcard);
router.get("/get-flashcard/:flashcardId", getFlashcard);
router.get("/get-flashcards", authGuard, allowRole("admin", "user"), getAllFlashcards);
router.patch("/update-flashcard/:flashcardId", authGuard, allowRole("admin"), upload.single("image"), validateRequest(updateFlashcardSchema), updateFlashcard);
router.delete("/delete-flashcard/:flashcardId", authGuard, allowRole("admin"), deleteFlashcard);

export default router;