import { Router } from "express";
import {
  createQuiz,
  getQuizQuestions,
  studyModeAnswer,
  submitQuiz,
  getQuizResult,
  getQuizProgress,
  getQuizHistory,
  getSingleQuestionResult,
  deleteQuiz,
  getAllQuizController,
} from "./quiz.controller";

import { allowRole, authGuard } from "../../middleware/auth.middleware";

const router = Router();

// History — specific route আগে রাখতে হবে :quizId এর আগে
router.get("/history", authGuard, allowRole("user"), getQuizHistory);

// Quiz create
router.post("/create", authGuard, allowRole("user"), createQuiz);

// Quiz questions
router.get(
  "/:quizId/questions",
  authGuard,
  allowRole("user"),
  getQuizQuestions,
);

// Study mode — per question answer
router.post("/:quizId/answer", authGuard, allowRole("user"), studyModeAnswer);

// Submit quiz
router.post("/:quizId/submit", authGuard, allowRole("user"), submitQuiz);

// Result
router.get("/:quizId/result", authGuard, allowRole("user"), getQuizResult);

// Progress
router.get("/:quizId/progress", authGuard, allowRole("user"), getQuizProgress);

router.get(
  "/:quizId/question/:questionId",
  authGuard,
  allowRole("user"),
  getSingleQuestionResult,
);

router.delete("/delete/:quizId", authGuard, allowRole("user"), deleteQuiz);

router.get(
  "/admin/all-quizzes",
  authGuard,
  allowRole("admin"),
  getAllQuizController,
);

const quizRoutes = router;
export default quizRoutes;
