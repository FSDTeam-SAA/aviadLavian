import { Router } from "express";
import {
  submitAnswer,
  toggleBookmark,
  getBookmarkedQuestions,
  getQuestionAttempts,
  getQuestionAttemptById,
  deleteQuestionAttempt,
  getQuestionHistory,
} from "../controllers/questionAttempt.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/exams/attempts/:attemptId/answer
 * @desc    Submit answer for a question
 * @access  Private (Student)
 * @body    { questionId, selectedOption, timeSpent, isBookmarked? }
 */
router.post("/exams/attempts/:attemptId/answer", submitAnswer);

/**
 * @route   GET /api/question-attempts/bookmarked
 * @desc    Get all bookmarked questions
 * @access  Private (Student)
 */
router.get("/question-attempts/bookmarked", getBookmarkedQuestions);

/**
 * @route   GET /api/question-attempts
 * @desc    Get question attempts with filters
 * @access  Private (Student)
 * @query   examAttemptId?, isBookmarked?, isCorrect?, page?, limit?
 */
router.get("/question-attempts", getQuestionAttempts);

/**
 * @route   GET /api/question-attempts/:questionAttemptId
 * @desc    Get single question attempt by ID
 * @access  Private (Student)
 */
router.get("/question-attempts/:questionAttemptId", getQuestionAttemptById);

/**
 * @route   GET /api/question-attempts/history/:questionId
 * @desc    Get user's attempt history for a specific question
 * @access  Private (Student)
 */
router.get("/question-attempts/history/:questionId", getQuestionHistory);

/**
 * @route   PATCH /api/question-attempts/:questionAttemptId/bookmark
 * @desc    Toggle bookmark status
 * @access  Private (Student)
 * @body    { isBookmarked: boolean }
 */
router.patch("/question-attempts/:questionAttemptId/bookmark", toggleBookmark);

/**
 * @route   DELETE /api/question-attempts/:questionAttemptId
 * @desc    Delete question attempt (only if exam not completed)
 * @access  Private (Student)
 */
router.delete("/question-attempts/:questionAttemptId", deleteQuestionAttempt);

export default router;
