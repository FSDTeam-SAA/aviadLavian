import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

import {
  startExamService,
  getExamQuestionsService,
  submitExamService,
  getExamHistoryService,
  getExamResultService,
} from "./examattempt.service";
import { Types } from "mongoose";

// ─────────────────────────────────────────────
// POST /exam-attempts/start
// নতুন exam শুরু
// ─────────────────────────────────────────────
export const startExam = asyncHandler(async (req: Request, res: Response) => {
  const { topicId, examName, timeLimitMinutes } = req.body;
  const userId = req.user?._id;

  if (!topicId ) {
    return ApiResponse.sendSuccess(
      res,
      400,
      "topicId is required",
    );
  }

  const exam = await startExamService(
    new Types.ObjectId(userId),
    topicId,
    examName,
    timeLimitMinutes,
  );

  return ApiResponse.sendSuccess(res, 201, "Exam started successfully", exam);
});

// ─────────────────────────────────────────────
// GET /exam-attempts/:examId/questions
// Exam এর সব question আনো (isCorrect hide থাকবে)
// ─────────────────────────────────────────────
export const getExamQuestions = asyncHandler(
  async (req: Request, res: Response) => {
    const { examId } = req.params;
    const userId = req.user?._id;

    const data = await getExamQuestionsService(
      new Types.ObjectId(examId as string),
      new Types.ObjectId(userId),
    );

    return ApiResponse.sendSuccess(
      res,
      200,
      "Exam questions fetched successfully",
      data,
    );
  },
);

// ─────────────────────────────────────────────
// POST /exam-attempts/:examId/submit
// Exam submit করো
// ─────────────────────────────────────────────
export const submitExam = asyncHandler(async (req: Request, res: Response) => {
  const { examId } = req.params;
  const { answers, timeSpentSeconds } = req.body;
  const userId = req.user?._id;

  if (!answers || !Array.isArray(answers)) {
    return ApiResponse.sendSuccess(res, 400, "answers array is required");
  }

  const result = await submitExamService(
    new Types.ObjectId(examId as string),
    new Types.ObjectId(userId),
    timeSpentSeconds || 0,
    answers,
  );

  return ApiResponse.sendSuccess(
    res,
    200,
    "Exam submitted successfully",
    result,
  );
});

// ─────────────────────────────────────────────
// GET /exam-attempts/:examId/result
// Submit এর পর full result দেখো
// ─────────────────────────────────────────────
export const getExamResult = asyncHandler(
  async (req: Request, res: Response) => {
    const { examId } = req.params;
    const userId = req.user?._id;

    const result = await getExamResultService(
      new Types.ObjectId(examId as string),
      new Types.ObjectId(userId),
    );

    return ApiResponse.sendSuccess(
      res,
      200,
      "Exam result fetched successfully",
      result,
    );
  },
);

// ─────────────────────────────────────────────
// GET /exam-attempts/history
// User এর সব past exam দেখো
// ─────────────────────────────────────────────
export const getExamHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const history = await getExamHistoryService(new Types.ObjectId(userId));

    return ApiResponse.sendSuccess(
      res,
      200,
      "Exam history fetched successfully",
      history,
      { total: history.length },
    );
  },
);
