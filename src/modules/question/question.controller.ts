import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateQuestion } from "./question.interface";
import { questionService } from "./question.service";

//TODO: customize as needed
export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateQuestion = req.body;
  const image = req.file as Express.Multer.File | undefined;
  const item = await questionService.createQuestion(data, image);
  ApiResponse.sendSuccess(res, 200, "Question created", item);
});
