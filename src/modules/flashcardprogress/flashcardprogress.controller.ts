import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { flashcardprogressService } from "./flashcardprogress.service";
import { ICreateFlashcardProgress } from "./flashcardprogress.interface";
import CustomError from "../../helpers/CustomError";

export const reviewFlashcard = asyncHandler(
  async (req: Request, res: Response) => {
    const userId: string = req.user?._id as string;
    const data: ICreateFlashcardProgress = req.body; 

    if (req.user?.role === "admin") throw new CustomError(403, "Admins are not allowed to take attempt flashcards");


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


//get all flashcard progress for a user
export const getFlashcardProgress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId: string = req.user?._id as string;
    const topicId: string = req.params.topicId as string;
    if (!topicId) throw new CustomError(400, "topicId query parameter is required");

    const progress = await flashcardprogressService.getFlashcardProgressByTopic(userId, topicId);

    ApiResponse.sendSuccess(
      res,
      200,
      "Flashcard progress retrieved successfully",
      progress
    );
  }
);
