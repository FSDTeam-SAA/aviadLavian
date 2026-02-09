import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { flashcardprogressService } from "./flashcardprogress.service";
import { ICreateFlashcardProgress } from "./flashcardprogress.interface";

export const reviewFlashcard = asyncHandler(
  async (req: Request, res: Response) => {
    const userId: string = req.user?._id as string;
    const data: ICreateFlashcardProgress = req.body;

    const { progress, message } = await flashcardprogressService.reviewFlashcard(
      userId,
      data.flashcardId,
      data.result,
      data.customInterval
    );

    ApiResponse.sendSuccess(
      res,
      200,
      message,
      progress
    );
  }
);
