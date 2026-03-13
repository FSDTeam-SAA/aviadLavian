import { Router } from "express";
import {
  getExamHistory,
  startExam,
  getExamQuestions,
  submitExam,
  getExamResult,
  getExamResultByQuestionIdController,
  deleteExamController,
  duplicateExamController,
  getAllExamController,
} from "./examattempt.controller";
import { allowRole, authGuard } from "../../middleware/auth.middleware";

const router = Router();

router.get("/history", authGuard, getExamHistory);

router.post("/start", authGuard, startExam);

router.get("/:examId/questions", authGuard, getExamQuestions);

router.post("/:examId/submit", authGuard, submitExam);

router.get("/:examId/result", authGuard, getExamResult);

router.get(
  "/:examId/questions/:questionId/result",
  authGuard,
  getExamResultByQuestionIdController,
);

router.delete("/delete/:examId", authGuard, deleteExamController);

router.post("/exam/:examId/duplicate", authGuard, duplicateExamController);

router.get(
  "/admin/get-all-exams",
  authGuard,
  allowRole("admin"),
  getAllExamController,
);
const examAttemptRoutes = router;
export default examAttemptRoutes;
