import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { FeedbackStatus, FeedbackType, IFeedback } from "./feedback.interface";

export interface IFeedbackDocument
  extends Omit<IFeedback, "_id" | "userId">, Document {
  userId: Types.ObjectId;
}

const FeedbackSchema: Schema<IFeedbackDocument> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    type: {
      type: String,
      enum: Object.values(FeedbackType),
      required: [true, "Feedback type is required"],
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      required: [true, "Rating is required"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      minlength: [5, "Subject must be at least 5 characters"],
      maxlength: [150, "Subject cannot exceed 150 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: Object.values(FeedbackStatus),
      default: FeedbackStatus.PENDING,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [500, "Admin notes cannot exceed 500 characters"],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for efficient querying
FeedbackSchema.index({ userId: 1, createdAt: -1 });
FeedbackSchema.index({ type: 1, status: 1 });
FeedbackSchema.index({ createdAt: -1 });

const Feedback: Model<IFeedbackDocument> = mongoose.model<IFeedbackDocument>(
  "Feedback",
  FeedbackSchema,
);

export default Feedback;
