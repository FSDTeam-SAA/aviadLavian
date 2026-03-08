import { Schema, model } from "mongoose";
import { IExamAnswer, IExamAttempt } from "./examattempt.interface";


const examAnswerSchema = new Schema<IExamAnswer>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedOptionId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const examAttemptSchema = new Schema<IExamAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topicId: {
      type: String,
      required: true,
    },
    examName: {
      type: String,
      required: true,
      trim: true,
    },

    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    answers: {
      type: [examAnswerSchema],
      default: [],
    },

    totalQuestions: {
      type: Number,
      required: true,
    },
    attemptedQuestions: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    incorrectAnswers: {
      type: Number,
      default: 0,
    },
    scorePercentage: {
      type: Number,
      default: 0,
    },

    totalMarks: {
      type: Number,
      required: true,
    },
    obtainedMarks: {
      type: Number,
      default: 0,
    },

    timeLimitMinutes: {
      type: Number,
      default: 120,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["ongoing", "submitted"],
      default: "ongoing",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

examAttemptSchema.index({ userId: 1, topicId: 1 });
examAttemptSchema.index({ userId: 1, status: 1 });

export const ExamAttemptModel = model<IExamAttempt>(
  "ExamAttempt",
  examAttemptSchema,
);
