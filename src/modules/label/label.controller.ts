import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateLabel } from "./label.interface";
import { LabelService } from "./label.service";

export const createLabel = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateLabel = req.body;
  const image = req.file as Express.Multer.File | undefined;
  const respose = await LabelService.createLabel(data, image);
  ApiResponse.sendSuccess(res, 201, "Label created successfully", respose);
});


//get single label
export const getSingleLabel = asyncHandler(async (req: Request, res: Response) => {
  const { labelId } = req.params;
  if (!labelId) throw new Error("Label id missing in params");

  const label = await LabelService.getLabelById(labelId as string);
  ApiResponse.sendSuccess(res, 200, "Label fetched successfully", label);
});

//get all labels
export const getAllLabel = asyncHandler(async (req: Request, res: Response) => {
  const { labels, pagination } = await LabelService.getAllLabel(req.query);
  ApiResponse.sendSuccess(res, 200, "Labels fetched successfully", labels, pagination);
})

//update label
export const updateLabel = asyncHandler(async (req: Request, res: Response) => {
  const { labelId } = req.params;
  if (!labelId) throw new Error("Label id missing in params");
  const data: ICreateLabel = req.body;
  const image = req.file as Express.Multer.File | undefined;
  const label = await LabelService.updateLabel(labelId as string, data, image);
  ApiResponse.sendSuccess(res, 200, "Label updated successfully", label);
})

//delete label
export const deleteLabel = asyncHandler(async (req: Request, res: Response) => {
  const { labelId } = req.params;
  if (!labelId) throw new Error("Label id missing in params");
  const label = await LabelService.deleteLabel(labelId as string);
  ApiResponse.sendSuccess(res, 200, "Label deleted successfully");
})