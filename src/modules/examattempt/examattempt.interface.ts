import { Types } from "mongoose";

// প্রতিটা question এ user কোন option দিয়েছে সেটা
export interface IExamAnswer {
  questionId: Types.ObjectId;
  selectedOptionId: Types.ObjectId | null; // null মানে attempt করেনি
  isCorrect: boolean;
}

// পুরো exam attempt
export interface IExamAttempt {
  userId: Types.ObjectId;
  topicId: string;
  examName: string;

  questions: Types.ObjectId[]; // 60 টা random question এর id
  answers: IExamAnswer[]; // user এর সব answer

  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  scorePercentage: number;

  totalMarks: number;
  obtainedMarks: number;

  timeLimitMinutes: number; // default 120
  timeSpentSeconds: number; // কতক্ষণ লেগেছে

  status: "ongoing" | "submitted" | "in-progress";
  startedAt: Date;
  submittedAt?: Date;
}
