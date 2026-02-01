import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateLabel } from "./label.interface";
import { LabelService } from "./label.service";

export const createSubCategory = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateLabel = req.body;
  const image = req.file as Express.Multer.File | undefined;
  const respose = await LabelService.createLabel(data, image);
  ApiResponse.sendSuccess(res, 201, "Label created successfully", respose);
});
