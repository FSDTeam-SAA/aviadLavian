import { Router } from "express";
import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  hideQuestion,
  unhideQuestion,
  updateQuestionOption,
} from "./question.controller";
import { allowRole, authGuard } from "../../middleware/auth.middleware";

const router = Router();

router.post("/create-question", authGuard, allowRole("admin"), createQuestion);
router.get(
  "/get-all-questions",
  authGuard,
  allowRole("admin"),
  getAllQuestions,
);
router.get(
  "/single-question/:id",
  authGuard,
  allowRole("admin"),
  getQuestionById,
);

router.patch(
  "/update-question/:id",
  authGuard,
  allowRole("admin"),
  updateQuestion,
);
router.patch(
  "/update-option/:questionId/options/:optionId",
  authGuard,
  allowRole("admin"),
  updateQuestionOption,
);
router.delete(
  "/delete-question/:id",
  authGuard,
  allowRole("admin"),
  deleteQuestion,
);
router.patch("/hide-question/:id", authGuard, allowRole("admin"), hideQuestion);
router.patch(
  "/unhide-question/:id",
  authGuard,
  allowRole("admin"),
  unhideQuestion,
);

export const questionRoute = router;
