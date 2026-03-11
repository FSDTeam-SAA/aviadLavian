import { Request, Response, NextFunction } from "express";
import {
  FeedbackStatus,
  FeedbackType,
  ICreateFeedbackDTO,
  IFeedbackQuery,
  IUpdateFeedbackDTO,
} from "./feedback.interface";
import feedbackService from "./feedback.service";
import CustomError from "../../helpers/CustomError";
import ApiResponse from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";


export const submitFeedback = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new CustomError(401, "User not authenticated");
    }

    const dto: ICreateFeedbackDTO = {
      type: req.body.type,
      rating: Number(req.body.rating),
      subject: req.body.subject?.trim(),
      message: req.body.message?.trim(),
    };

    if (!Object.values(FeedbackType).includes(dto.type)) {
      throw new CustomError(
        400,
        `Invalid feedback type. Valid types: ${Object.values(FeedbackType).join(", ")}`,
      );
    }

    if (dto.rating < 1 || dto.rating > 5) {
      throw new CustomError(400, "Rating must be between 1 and 5");
    }

    const feedback = await feedbackService.createFeedback(
      userId as string,
      dto,
    );

    ApiResponse.sendSuccess(
      res,
      201,
      "Feedback submitted successfully. Thank you!",
      feedback,
    );
  },
);


export const getMyFeedbacks = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new CustomError(401, "User not authenticated");
    }

    const result = await feedbackService.getFeedbacksByUser(
      userId as string,
      req.query,
    );

    ApiResponse.sendSuccess(res, 200, "Feedbacks fetched successfully", result);
  },
);

export const getFeedbackById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = req.params;

    if (!id) {
      throw new CustomError(400, "Feedback ID is required");
    }

    const feedback = await feedbackService.getFeedbackById(
      id as string,
      userId as string,
    );

    if (!feedback) {
      throw new CustomError(404, "Feedback not found");
    }

    ApiResponse.sendSuccess(
      res,
      200,
      "Feedback fetched successfully",
      feedback,
    );
  },
);


export const getAllFeedbacks = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await feedbackService.getAllFeedbacks(req.query);

    ApiResponse.sendSuccess(
      res,
      200,
      "All feedbacks fetched successfully",
      result,
    );
  },
);


export const getFeedbackByUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      throw new CustomError(400, "User ID is required");
    }

    const result = await feedbackService.getFeedbackByUser(
      userId as string,
      req.query,
    );

    ApiResponse.sendSuccess(
      res,
      200,
      "User feedbacks fetched successfully",
      result,
    );
  },
);


export const getFeedbackStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await feedbackService.getFeedbackStats();

    ApiResponse.sendSuccess(
      res,
      200,
      "Feedback stats fetched successfully",
      stats,
    );
  },
);


export const updateFeedbackStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new CustomError(400, "Feedback ID is required");
    }

    const dto: IUpdateFeedbackDTO = {
      status: req.body.status,
      adminNotes: req.body.adminNotes?.trim(),
    };

    if (dto.status && !Object.values(FeedbackStatus).includes(dto.status)) {
      throw new CustomError(
        400,
        `Invalid status. Valid statuses: ${Object.values(FeedbackStatus).join(", ")}`,
      );
    }

    const updated = await feedbackService.updateFeedback(id as string, dto);

    if (!updated) {
      throw new CustomError(404, "Feedback not found");
    }

    ApiResponse.sendSuccess(res, 200, "Feedback updated successfully", updated);
  },
);


export const deleteFeedback = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new CustomError(400, "Feedback ID is required");
    }

    const deleted = await feedbackService.deleteFeedback(id as string);

    if (!deleted) {
      throw new CustomError(404, "Feedback not found");
    }

    ApiResponse.sendSuccess(res, 200, "Feedback deleted successfully", null);
  },
);
