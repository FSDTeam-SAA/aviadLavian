import { Schema, model } from "mongoose";
import { IQuestion } from "./question.interface";

const optionSchema = new Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: true },
);

const questionSchema = new Schema<IQuestion>(
  {
    subTopicId: {
      type: Schema.Types.ObjectId,
      ref: "SubTopic",
      required: true,
    },
    questionText: { type: String, required: true },
    options: { type: [optionSchema], required: true },
    explanation: { type: String },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    marks: { type: Number, default: 1 },
    isHidden: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const QuestionModel = model<IQuestion>("Question", questionSchema);
