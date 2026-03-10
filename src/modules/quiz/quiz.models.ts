import { Schema, model } from "mongoose";
import { IQuiz, IQuizAnswer } from "./quiz.interface";

const quizAnswerSchema = new Schema<IQuizAnswer>(
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
    answeredAt: {
      type: Date,
    },
  },
  { _id: false },
);

const quizSchema = new Schema<IQuiz>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // multiple topics array
    topicIds: {
      type: [String],
      required: true,
    },

    quizName: {
      type: String,
      default: () => Date.now().toString(),
      trim: true,
    },
    mode: {
      type: String,
      enum: ["study", "exam"],
      required: true,
    },

    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    answers: {
      type: [quizAnswerSchema],
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
      default: null,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },

    isPaused: {
      type: Boolean,
      default: false,
    },
    pausedAt: {
      type: Date,
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

quizSchema.index({ userId: 1, status: 1 });
quizSchema.index({ userId: 1, topicIds: 1 });
quizSchema.index({ userId: 1, mode: 1 });

export const QuizModel = model<IQuiz>("Quiz", quizSchema);
