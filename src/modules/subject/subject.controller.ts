import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import CustomError from "../../helpers/CustomError";

import { ICreateSubject } from "./subject.interface";
import { subjectService } from "./subject.service";

//create category
export const createSubject = asyncHandler(
  async (req: Request, res: Response) => {
    const data: ICreateSubject = req.body;
    const image = req?.file as Express.Multer.File | undefined;
    const subject = await subjectService.createSubject(data, image);
    ApiResponse.sendSuccess(res, 201, "Subject created successfully", subject);
  }
);

//get all categories
export const getAllSubject = asyncHandler(
  async (req: Request, res: Response) => {
    const { subjects, pagination } = await subjectService.getAllSubject(req.query);
    ApiResponse.sendSuccess(res, 200, "Subjects fetched successfully", subjects, pagination);
  }
);

//get single category
export const getSingleSubject = asyncHandler(
  async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    if (!subjectId) throw new CustomError(400, "Subject id missing in params");
    const category = await subjectService.getSingleSubject(subjectId as string);
    ApiResponse.sendSuccess(res, 200, "Subject fetched successfully", category);
  }
);

//update category
export const updateSubject = asyncHandler(
  async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    if (!subjectId) throw new CustomError(400, "Subject id missing in params");
    const data: ICreateSubject = req.body;
    const image = req?.file as Express.Multer.File | undefined;
    const subject = await subjectService.updateSubject(subjectId as string, data, image);
    ApiResponse.sendSuccess(res, 200, "Subject updated successfully", subject);
  }
)

//delete category
export const deleteSubject = asyncHandler(
  async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    if (!subjectId) throw new CustomError(400, "Subject id missing in params");
    const category = await subjectService.deleteSubject(subjectId as string);
    ApiResponse.sendSuccess(res, 200, "Subject deleted successfully",);
  }
)