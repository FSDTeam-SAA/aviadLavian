import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

import { Types } from "mongoose";
import {
  attemptQuestionBankService,
  getAttemptByTopicService,
  getQuestionDetailsService,
  getQuestionsByTopicService,
} from "./questionbank.service";

export const getQuestionsByTopic = asyncHandler(
  async (req: Request, res: Response) => {
    const { topicId } = req.params;
    const userId = req.user?._id;

    const questions = await getQuestionsByTopicService(
      topicId as string,
      userId as string,
    );

    return ApiResponse.sendSuccess(
      res,
      200,
      "Questions fetched successfully",
      questions,
      { total: questions.length },
    );
  },
);

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

export const getQuestionDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionId } = req.params;
    const userId = req.user?._id;

    const question = await getQuestionDetailsService(
      new Types.ObjectId(questionId as string),
      new Types.ObjectId(userId),
    );

    return ApiResponse.sendSuccess(
      res,
      200,
      "Question details fetched successfully",
      question,
    );
  },
);

export const getAttemptByTopicController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { topicId } = req.params;
    const userId = req.user?._id; // assume userId is attached by auth middleware

    if (!topicId) {
      return res.status(400).json({ message: "topicId is required" });
    }

    const result = await getAttemptByTopicService(
      topicId as string,
      new Types.ObjectId(userId),
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};
