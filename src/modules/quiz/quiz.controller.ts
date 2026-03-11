import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import {
  createQuizService,
  getQuizQuestionsService,
  studyModeAnswerService,
  submitQuizService,
  getQuizResultService,
  getQuizProgressService,
  getQuizHistoryService,
  getSingleQuestionResultService,
  deleteQuizService,
  getAllQuizService,
} from "./quiz.service";
import { Types } from "mongoose";

export const createQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { topicIds, quizName, mode, questionCount, timeLimitMinutes } =
    req.body;
  const userId = req.user?._id;

  if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
    return ApiResponse.sendSuccess(
      res,
      400,
      "At least one topicId is required",
    );
  }

  if (!mode || !["study", "exam"].includes(mode)) {
    return ApiResponse.sendSuccess(res, 400, "mode must be 'study' or 'exam'");
  }
  if (!questionCount || questionCount < 1) {
    return ApiResponse.sendSuccess(
      res,
      400,
      "questionCount must be at least 1",
    );
  }

  const quiz = await createQuizService(
    new Types.ObjectId(userId),
    topicIds,
    quizName,
    mode,
    questionCount,
    timeLimitMinutes ?? null,
  );

  return ApiResponse.sendSuccess(res, 201, "Quiz created successfully", quiz);
});

export const getQuizQuestions = asyncHandler(
  async (req: Request, res: Response) => {
    const { quizId } = req.params;
    const userId = req.user?._id;

    const data = await getQuizQuestionsService(
      new Types.ObjectId(quizId as string),
      new Types.ObjectId(userId),
    );

    return ApiResponse.sendSuccess(
      res,
      200,
      "Quiz questions fetched successfully",
      data,
    );
  },
);

export const studyModeAnswer = asyncHandler(
  async (req: Request, res: Response) => {
    const { quizId } = req.params;
    const { questionId, selectedOptionId } = req.body;
    const userId = req.user?._id;

    if (!questionId || !selectedOptionId) {
      return ApiResponse.sendSuccess(
        res,
        400,
        "questionId and selectedOptionId are required",
      );
    }

    const result = await studyModeAnswerService(
      new Types.ObjectId(quizId as string),
      new Types.ObjectId(userId),
      new Types.ObjectId(questionId),
      new Types.ObjectId(selectedOptionId),
    );

    return ApiResponse.sendSuccess(
      res,
      200,
      result.isCorrect ? "Correct answer!" : "Wrong answer!",
      result,
    );
  },
);

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.params;
  const { timeSpentSeconds, answers } = req.body;
  const userId = req.user?._id;

  const result = await submitQuizService(
    new Types.ObjectId(quizId as string),
    new Types.ObjectId(userId),
    timeSpentSeconds || 0,
    answers,
  );

  return ApiResponse.sendSuccess(
    res,
    200,
    "Quiz submitted successfully",
    result,
  );
});

export const getQuizResult = asyncHandler(
  async (req: Request, res: Response) => {
    const { quizId } = req.params;
    const userId = req.user?._id;

    const result = await getQuizResultService(
      new Types.ObjectId(quizId as string),
      new Types.ObjectId(userId),
    );

    return ApiResponse.sendSuccess(
      res,
      200,
      "Quiz result fetched successfully",
      result,
    );
  },
);

export const getQuizProgress = asyncHandler(
  async (req: Request, res: Response) => {
    const { quizId } = req.params;
    const userId = req.user?._id;

    const progress = await getQuizProgressService(
      new Types.ObjectId(quizId as string),
      new Types.ObjectId(userId),
    );

    return ApiResponse.sendSuccess(
      res,
      200,
      "Quiz progress fetched successfully",
      progress,
    );
  },
);

export const getQuizHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { mode } = req.query; // optional: ?mode=exam or ?mode=study

    const quizzes = await getQuizHistoryService(
      new Types.ObjectId(userId),
      mode === "exam" || mode === "study"
        ? (mode as "exam" | "study")
        : undefined,
    );

    return ApiResponse.sendSuccess(
      res,
      200,
      "Submitted quizzes fetched successfully",
      quizzes,
    );
  },
);

export const getSingleQuestionResult = asyncHandler(
  async (req: Request, res: Response) => {
    const { quizId, questionId } = req.params;
    const userId = req.user?._id;

    const result = await getSingleQuestionResultService(
      new Types.ObjectId(quizId as string),
      new Types.ObjectId(userId),
      new Types.ObjectId(questionId as string),
    );

    return ApiResponse.sendSuccess(
      res,
      200,
      "Single question result fetched successfully",
      result,
    );
  },
);

export const deleteQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.params;
  const userId = req.user?._id;

  const result = await deleteQuizService(
    new Types.ObjectId(quizId as string),
    new Types.ObjectId(userId),
  );

  return ApiResponse.sendSuccess(res, 200, result.message, null);
});

export const getAllQuizController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getAllQuizService(req.query);

    ApiResponse.sendSuccess(
      res,
      200,
      "All quizzes retrieved successfully",
      result,
    );
  },
);
