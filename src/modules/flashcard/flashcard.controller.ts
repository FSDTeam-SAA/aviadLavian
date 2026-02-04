import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateFlashcard } from "./flashcard.interface";
import { flashcardService } from "./flashcard.service";

//TODO: customize as needed
export const createFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateFlashcard = req.body;
  const item = await flashcardService.createFlashcard(data);
  ApiResponse.sendSuccess(res, 200, "Flashcard created", item);
});
