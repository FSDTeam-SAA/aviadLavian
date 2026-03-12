import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ProgressService } from "./progress.service";
import { IUser } from "../usersAuth/user.interface";

//get progress for admin and user
export const getProgressOverview = asyncHandler(async (req: Request, res: Response) => {
  const progress = await ProgressService.getProgressOverview(req.user as IUser);
  ApiResponse.sendSuccess(res, 200, "Progress retrieved successfully", progress);
})


export const getTopPerformingStudents = asyncHandler(async (req, res) => {
  const result = await ProgressService.getTopPerformingStudents(req.query);

  res.status(200).json({
    success: true,
    message: "Top performing students retrieved successfully",
    data: result,
  });
});