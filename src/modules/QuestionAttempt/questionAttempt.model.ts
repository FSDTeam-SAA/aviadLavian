import { Schema, model } from "mongoose";
import { IAttempt } from "./questionAttempt.interface";


const attemptSchema = new Schema<IAttempt>(
  {
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedOptionId: { type: Schema.Types.ObjectId, required: true },
    isCorrect: { type: Boolean, required: true },
    marksObtained: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const AttemptModel = model<IAttempt>("Attempt", attemptSchema);
