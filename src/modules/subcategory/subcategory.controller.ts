import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateSubCategory } from "./subcategory.interface";
import { subcategoryService } from "./subcategory.service";

export const createSubCategory = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateSubCategory = req.body;
  const image = req.file as Express.Multer.File | undefined;
  const respose = await subcategoryService.createSubCategory(data, image);
  ApiResponse.sendSuccess(res, 200, "SubCategory created", respose);
});
