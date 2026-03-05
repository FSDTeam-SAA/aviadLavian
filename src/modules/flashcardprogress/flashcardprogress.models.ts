import mongoose, { Schema } from "mongoose";
import { IFlashcardProgressDocument } from "./flashcardprogress.interface";


const flashcardProgressSchema = new Schema<IFlashcardProgressDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    flashcardId: {
      type: Schema.Types.ObjectId,
      ref: "Flashcard",
      required: true,
    },

    repetitions: {
      type: Number,
      default: 0,
    },

    interval: {
      type: Number,
      default: 1,
    },

    userAnswer: {
      type: String,
    },

    easeFactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
    },

    lastQuality: {
      type: Number,
      enum: [1, 3, 5],
    },

    lastReviewedAt: {
      type: Date,
    },

    nextReviewAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// One progress per user per flashcard
flashcardProgressSchema.index(
  { userId: 1, flashcardId: 1 },
  { unique: true }
);

export const FlashcardProgressModel = mongoose.model<IFlashcardProgressDocument>(
  "FlashcardProgress",
  flashcardProgressSchema
);
