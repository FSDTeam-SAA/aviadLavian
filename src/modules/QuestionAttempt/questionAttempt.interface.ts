import { Types } from "mongoose";

export interface IAttempt {
  examId: Types.ObjectId;
  userId: Types.ObjectId;
  questionId: Types.ObjectId;
  selectedOptionId: Types.ObjectId;
  isCorrect: boolean;
  marksObtained: number;
}
