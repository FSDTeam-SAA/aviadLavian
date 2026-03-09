import { Router } from "express";
import {
  getExamHistory,
  startExam,
  getExamQuestions,
  submitExam,
  getExamResult,
  getExamResultByQuestionIdController,
} from "./examattempt.controller";
import { authGuard } from "../../middleware/auth.middleware";

const router = Router();

// সব past exam history
router.get("/history", authGuard, getExamHistory);

// নতুন exam শুরু
router.post("/start", authGuard, startExam);

// Exam এর questions আনো
router.get("/:examId/questions", authGuard, getExamQuestions);

// Exam submit
router.post("/:examId/submit", authGuard, submitExam);

// Exam result
router.get("/:examId/result", authGuard, getExamResult);

router.get(
  "/:examId/questions/:questionId/result",
  authGuard, 
  getExamResultByQuestionIdController,
);

const examAttemptRoutes = router;
export default examAttemptRoutes;
