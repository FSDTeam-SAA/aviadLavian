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

//get all categories
export const getAllCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const { categories, pagination } = await categoryService.getAllCategories(req.query);
    ApiResponse.sendSuccess(res, 200, "Categories fetched", categories, pagination);
  }
);

//get single category
export const getSingleCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    if (!categoryId) throw new CustomError(400, "Category id missing in params");
    const category = await categoryService.getSingleCategory(categoryId as string);
    ApiResponse.sendSuccess(res, 200, "Category fetched", category);
  }
);

//update category
export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    if (!categoryId) throw new CustomError(400, "Category id missing in params");
    const data: ICreateCategory = req.body;
    const image = req?.file as Express.Multer.File | undefined;
    const category = await categoryService.updateCategory(categoryId as string, data, image);
    ApiResponse.sendSuccess(res, 200, "Category updated", category);
  }
)