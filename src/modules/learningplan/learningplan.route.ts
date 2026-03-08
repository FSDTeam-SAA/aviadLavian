import express from "express";
import { learningPlanController } from "./learningplan.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import {
    createLearningPlanSchema,
    updateLearningPlanSchema,
    addFlashcardSchema,
    updateFlashcardProgressSchema,
    addArticleSchema,
    updateArticleProgressSchema,
} from "./learningplan.validation";
import { authGuard } from "../../middleware/auth.middleware";

const router = express.Router();

// ── Learning Plan CRUD ──
router.post(
    "/create",
    authGuard,
    validateRequest(createLearningPlanSchema, { allowEmpty: true }),
    learningPlanController.createLearningPlan
);

router.get("/get-all", authGuard, learningPlanController.getAllLearningPlans);

router.get("/get/:id", authGuard, learningPlanController.getSingleLearningPlan);

router.patch(
    "/update/:id",
    authGuard,
    validateRequest(updateLearningPlanSchema),
    learningPlanController.updateLearningPlan
);

router.delete(
    "/delete/:id",
    authGuard,
    learningPlanController.deleteLearningPlan
);

// ── Flashcard operations within a plan ──
router.post(
    "/:planId/flashcard",
    authGuard,
    validateRequest(addFlashcardSchema),
    learningPlanController.addFlashcardToPlan
);

router.patch(
    "/:planId/flashcard/:flashcardId",
    authGuard,
    validateRequest(updateFlashcardProgressSchema),
    learningPlanController.updateFlashcardProgress
);

router.delete(
    "/:planId/flashcard/:flashcardId",
    authGuard,
    learningPlanController.removeFlashcardFromPlan
);

// ── Article operations within a plan ──
router.post(
    "/:planId/article",
    authGuard,
    validateRequest(addArticleSchema),
    learningPlanController.addArticleToPlan
);

router.patch(
    "/:planId/article/:articleId",
    authGuard,
    validateRequest(updateArticleProgressSchema),
    learningPlanController.updateArticleProgress
);

router.delete(
    "/:planId/article/:articleId",
    authGuard,
    learningPlanController.removeArticleFromPlan
);

export const learningPlanRoute = router;
