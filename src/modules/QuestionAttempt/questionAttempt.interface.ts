import { Types } from "mongoose";

// Question Attempt Interface
export interface IQuestionAttempt {
  _id: string;
  examAttempt: string | Types.ObjectId;
  question: string | Types.ObjectId;
  user: string | Types.ObjectId;
  selectedOption: number; // 0-based index
  isCorrect: boolean;
  marksObtained: number;
  timeSpent: number; // seconds
  isBookmarked: boolean;
  attemptedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// DTO for creating question attempt
export interface CreateQuestionAttemptDto {
  examAttemptId: string;
  questionId: string;
  selectedOption: number;
  timeSpent: number;
  isBookmarked?: boolean;
}

// DTO for updating bookmark status
export interface UpdateBookmarkDto {
  questionAttemptId: string;
  isBookmarked: boolean;
}

// Response for tutor mode
export interface TutorModeResponse {
  isCorrect: boolean;
  correctOption: number;
  explanation: string;
  stats: {
    totalAttempts: number;
    correctAttempts: number;
    accuracyRate: number;
    optionPercentages: { [key: number]: number };
  };
}

// Response for test mode
export interface TestModeResponse {
  isCorrect: boolean;
}

// Question attempt with populated data
export interface IQuestionAttemptPopulated extends Omit<
  IQuestionAttempt,
  "question"
> {
  question: {
    _id: string;
    questionText: string;
    options: Array<{ text: string; isCorrect: boolean }>;
    explanation: string;
    difficulty: string;
    marks: number;
  };
}

// Get bookmarked questions response
export interface BookmarkedQuestion {
  _id: string;
  question: {
    _id: string;
    questionText: string;
    difficulty: string;
    topic: {
      _id: string;
      name: string;
    };
  };
  selectedOption: number;
  isCorrect: boolean;
  marksObtained: number;
  attemptedAt: Date;
}

// Query params for fetching attempts
export interface GetAttemptsQuery {
  examAttemptId?: string;
  isBookmarked?: boolean;
  isCorrect?: boolean;
  limit?: number;
  page?: number;
}
