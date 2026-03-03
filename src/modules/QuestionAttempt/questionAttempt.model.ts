import mongoose, { Document, Schema } from "mongoose";

export interface IQuestionAttemptDocument extends Document {
  examAttempt: mongoose.Types.ObjectId;
  question: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  selectedOption: number;
  isCorrect: boolean;
  marksObtained: number;
  timeSpent: number;
  isBookmarked: boolean;
  attemptedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionAttemptSchema = new Schema<IQuestionAttemptDocument>(
  {
    examAttempt: {
      type: Schema.Types.ObjectId,
      ref: "ExamAttempt",
      required: [true, "Exam attempt is required"],
      index: true,
    },
    question: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question is required"],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    selectedOption: {
      type: Number,
      required: [true, "Selected option is required"],
      min: [0, "Selected option must be 0 or greater"],
    },
    isCorrect: {
      type: Boolean,
      required: [true, "isCorrect field is required"],
      index: true,
    },
    marksObtained: {
      type: Number,
      required: [true, "Marks obtained is required"],
    },
    timeSpent: {
      type: Number,
      default: 0,
      min: [0, "Time spent cannot be negative"],
    },
    isBookmarked: {
      type: Boolean,
      default: false,
      index: true,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for query optimization
QuestionAttemptSchema.index({ examAttempt: 1, question: 1 }, { unique: true });
QuestionAttemptSchema.index({ user: 1, question: 1 });
QuestionAttemptSchema.index({ user: 1, isBookmarked: 1 });
QuestionAttemptSchema.index({ user: 1, isCorrect: 1 });
QuestionAttemptSchema.index({ examAttempt: 1, attemptedAt: 1 });

// Pre-save hook to validate selectedOption against question options
QuestionAttemptSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const Question = mongoose.model("Question");
      const question = await Question.findById(this.question);

      if (!question) {
        throw new Error("Question not found");
      }

      if (this.selectedOption >= question.options.length) {
        throw new Error("Invalid option selected");
      }
    } catch (error) {
      return error as Error;
    }
  }
});

export const QuestionAttempt = mongoose.model<IQuestionAttemptDocument>(
  "QuestionAttempt",
  QuestionAttemptSchema,
);
