import { Schema, model } from "mongoose";
import { IQuestionBankAttempt } from "./questionbank.interface";

const questionBankAttemptSchema = new Schema<IQuestionBankAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    topicId: {
      type: String,
      // required: true,
    },
    selectedOptionId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    isAttempted: {
      type: Boolean,
      required: true,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// একজন user একটা question একবারই attempt করতে পারবে
// তবে সে চাইলে re-attempt করতে পারবে, তাই unique index নেই
// শুধু query fast করার জন্য index
questionBankAttemptSchema.index({ userId: 1, questionId: 1 });
questionBankAttemptSchema.index({ questionId: 1 });

export const QuestionBankAttemptModel = model<IQuestionBankAttempt>(
  "QuestionBankAttempt",
  questionBankAttemptSchema,
);
