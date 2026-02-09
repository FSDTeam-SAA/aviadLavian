import { Types, Document } from "mongoose";

// Interface representing a flashcard progress
export interface IFlashcardProgress {
  userId: Types.ObjectId;
  flashcardId: Types.ObjectId;

  repetitions: number;
  interval: number;
  easeFactor: number;

  lastQuality?: number; // 1 | 3 | 5;
  lastReviewedAt?: Date;
  nextReviewAt?: Date;
}

// extends Mongoose document type
export interface IFlashcardProgressDocument
  extends IFlashcardProgress,
  Document { }

// Request body type for creating a new flashcard progress
export interface ICreateFlashcardProgress {
  flashcardId: string;
  result: "wrong" | "unknown" | "correct";
  customInterval?: string;
}
