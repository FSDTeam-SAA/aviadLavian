import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { submitAnswerValidation } from "./questionAttempt.validation";




/**
 * Submit answer for a question
 * POST /api/exams/attempts/:attemptId/answer
 */
export const submitAnswer = asyncHandler(
  async (req: Request, res: Response) => {
    const { attemptId } = req.params;
    const userId = (req as any).user._id;

    // Validate request body
    const { error, value } = submitAnswerValidation.validate(req.body);

    if (error) {
      return ApiResponse.sendError(
        res,
        400,
        "Validation error",
        error.details.map((d: { message: any; }) => d.message),
      );
    }

    const result = await QuestionAttemptService.submitAnswer(userId, {
      examAttemptId: attemptId,
      ...value,
    });

    ApiResponse.sendSuccess(res, 201, "Answer submitted successfully", result);
  },
);

/**
 * Toggle bookmark status
 * PATCH /api/question-attempts/:questionAttemptId/bookmark
 */
export const toggleBookmark = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionAttemptId } = req.params;
    const userId = (req as any).user._id;

    // Validate params
    const paramValidation = questionAttemptIdValidation.validate({
      questionAttemptId,
    });
    if (paramValidation.error) {
      return ApiResponse.sendError(res, 400, "Invalid question attempt ID");
    }

    // Validate body
    const { error, value } = updateBookmarkValidation.validate(req.body);

    if (error) {
      return ApiResponse.sendError(
        res,
        400,
        "Validation error",
        error.details.map((d) => d.message),
      );
    }

    const result = await QuestionAttemptService.toggleBookmark(
      userId,
      questionAttemptId,
      value.isBookmarked,
    );

    ApiResponse.sendSuccess(
      res,
      200,
      value.isBookmarked ? "Question bookmarked" : "Bookmark removed",
      result,
    );
  },
);

/**
 * Get all bookmarked questions
 * GET /api/question-attempts/bookmarked
 */
export const getBookmarkedQuestions = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user._id;

    const bookmarked =
      await QuestionAttemptService.getBookmarkedQuestions(userId);

    ApiResponse.sendSuccess(
      res,
      200,
      "Bookmarked questions fetched successfully",
      bookmarked,
    );
  },
);

/**
 * Get question attempts with filters
 * GET /api/question-attempts
 */
export const getQuestionAttempts = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user._id;

    // Validate query params
    const { error, value } = getAttemptsQueryValidation.validate(req.query);

    if (error) {
      return ApiResponse.sendError(
        res,
        400,
        "Validation error",
        error.details.map((d) => d.message),
      );
    }

    const result = await QuestionAttemptService.getQuestionAttempts(
      userId,
      value,
    );

    ApiResponse.sendSuccess(
      res,
      200,
      "Question attempts fetched successfully",
      result,
    );
  },
);

/**
 * Get single question attempt by ID
 * GET /api/question-attempts/:questionAttemptId
 */
export const getQuestionAttemptById = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionAttemptId } = req.params;
    const userId = (req as any).user._id;

    // Validate params
    const { error } = questionAttemptIdValidation.validate({
      questionAttemptId,
    });

    if (error) {
      return ApiResponse.sendError(res, 400, "Invalid question attempt ID");
    }

    const attempt = await QuestionAttemptService.getQuestionAttemptById(
      userId,
      questionAttemptId,
    );

    ApiResponse.sendSuccess(
      res,
      200,
      "Question attempt fetched successfully",
      attempt,
    );
  },
);

/**
 * Delete question attempt
 * DELETE /api/question-attempts/:questionAttemptId
 */
export const deleteQuestionAttempt = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionAttemptId } = req.params;
    const userId = (req as any).user._id;

    // Validate params
    const { error } = questionAttemptIdValidation.validate({
      questionAttemptId,
    });

    if (error) {
      return ApiResponse.sendError(res, 400, "Invalid question attempt ID");
    }

    const result = await QuestionAttemptService.deleteQuestionAttempt(
      userId,
      questionAttemptId,
    );

    ApiResponse.sendSuccess(res, 200, result.message);
  },
);

/**
 * Get user's attempt history for a specific question
 * GET /api/question-attempts/history/:questionId
 */
export const getQuestionHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionId } = req.params;
    const userId = (req as any).user._id;

    const history = await QuestionAttemptService.getQuestionHistory(
      userId,
      questionId,
    );

    ApiResponse.sendSuccess(
      res,
      200,
      "Question history fetched successfully",
      history,
    );
  },
);
