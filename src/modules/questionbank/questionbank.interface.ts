import { Types } from "mongoose";

// একজন user একটা specific option select করেছে কিনা
export interface IQuestionBankAttempt {
  userId: Types.ObjectId;
  questionId: Types.ObjectId;
  selectedOptionId: Types.ObjectId;
  isCorrect: boolean;
  attemptedAt: Date;
}
