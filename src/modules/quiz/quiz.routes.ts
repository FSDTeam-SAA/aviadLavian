import { Router } from "express";
import {
  createQuiz,
  getQuizQuestions,
  studyModeAnswer,
  submitQuiz,
  getQuizResult,
  getQuizProgress,
  getQuizHistory,
} from "./quiz.controller";

import { authGuard } from "../../middleware/auth.middleware";

const router = Router();

// History — specific route আগে রাখতে হবে :quizId এর আগে
router.get("/history", authGuard, getQuizHistory);

// Quiz create
router.post("/create", authGuard, createQuiz);

// Quiz questions
router.get("/:quizId/questions", authGuard, getQuizQuestions);

// Study mode — per question answer
router.post("/:quizId/answer", authGuard, studyModeAnswer);

// Submit quiz
router.post("/:quizId/submit", authGuard, submitQuiz);

// Result
router.get("/:quizId/result", authGuard, getQuizResult);

// Progress
router.get("/:quizId/progress", authGuard, getQuizProgress);

const quizRoutes = router;
export default quizRoutes;
