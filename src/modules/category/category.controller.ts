import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import CustomError from "../../helpers/CustomError";

import { ICreateCategory } from "./category.interface";
import { categoryService } from "./category.service";

//create category
export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const data: ICreateCategory = req.body;
    const image = req?.file as Express.Multer.File | undefined;
  
    const category = await categoryService.createCategory(data, image);
    ApiResponse.sendSuccess(res, 200, "Category created", category);
  }
);