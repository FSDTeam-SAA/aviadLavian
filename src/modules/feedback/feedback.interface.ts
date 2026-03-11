import { Types } from "mongoose";

export enum FeedbackType {
  GENERAL = "General Feedback",
  FEATURE_REQUEST = "Feature request",
  BUG_REPORT = "Bug Report",
  IMPROVEMENT = "Improvement Suggestion",
}

export enum FeedbackStatus {
  PENDING = "pending",
  REVIEWED = "reviewed",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}

export interface IFeedback {
  _id?: unknown;
  userId: {
    type: Types.ObjectId;
    ref: "User";
    required: [true, "User ID is required"];
  };
  type: FeedbackType;
  rating: number; // 1-5
  subject: string;
  message: string;
  status: FeedbackStatus;
  adminNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateFeedbackDTO {
  type: FeedbackType;
  rating: number;
  subject: string;
  message: string;
}

export interface IUpdateFeedbackDTO {
  status?: FeedbackStatus;
  adminNotes?: string;
}

export interface IFeedbackQuery {
  page?: number;
  limit?: number;
  type?: FeedbackType;
  status?: FeedbackStatus;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface IFeedbackResponse {
  success: boolean;
  message: string;
  data?: IFeedback | IFeedback[] | null;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
