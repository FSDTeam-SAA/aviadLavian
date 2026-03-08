import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

import { Types } from "mongoose";
import { attemptQuestionBankService, getQuestionDetailsService, getQuestionsByTopicService } from "./questionbank.service";

// ─────────────────────────────────────────────
// GET /question-bank/topics/:topicId/questions
// Topic select করলে সব question আসবে
// ─────────────────────────────────────────────
export const getQuestionsByTopic = asyncHandler(
  async (req: Request, res: Response) => {
    const { topicId } = req.params;

    const questions = await getQuestionsByTopicService(topicId as string);

    return ApiResponse.sendSuccess(
      res,
      200,
      "Questions fetched successfully",
      questions,
      { total: questions.length },
    );
  },
);

// ─────────────────────────────────────────────
// POST /question-bank/questions/:questionId/attempt
// User একটা question attempt করবে
// ─────────────────────────────────────────────
export const attemptQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionId } = req.params;
    const { selectedOptionId } = req.body;

    // Auth middleware থেকে userId আসবে
    const userId = req.user?._id;

    if (!selectedOptionId) {
      return ApiResponse.sendSuccess(res, 400, "selectedOptionId is required");
    }

    const result = await attemptQuestionBankService(
      new Types.ObjectId(userId),
      new Types.ObjectId(questionId as string),
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

// ─────────────────────────────────────────────
// GET /question-bank/questions/:questionId
// Specific question এর details + explanation + option stats
// ─────────────────────────────────────────────
export const getQuestionDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionId } = req.params;

    const question = await getQuestionDetailsService(
      new Types.ObjectId(questionId as string ),
    );

    return ApiResponse.sendSuccess(
      res,
      200,
      "Question details fetched successfully",
      question,
    );
  },
);
