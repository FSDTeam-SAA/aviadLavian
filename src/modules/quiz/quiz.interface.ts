import { Types } from "mongoose";

export interface IQuizAnswer {
  questionId: Types.ObjectId;
  selectedOptionId: Types.ObjectId | null;
  isCorrect: boolean;
  answeredAt?: Date;
}

export interface IQuiz {
  userId: Types.ObjectId;

  topicIds: string[]; // multiple topic support

  quizName: string;
  mode: "study" | "exam";

  questions: Types.ObjectId[];
  answers: IQuizAnswer[];

  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  scorePercentage: number;

  totalMarks: number;
  obtainedMarks: number;

  timeLimitMinutes: number | null; // null = no timer
  timeSpentSeconds: number;

  isPaused: boolean;
  pausedAt?: Date;

  status: "ongoing" | "submitted";
  startedAt: Date;
  submittedAt?: Date;
}
