import { Schema, model, CallbackError } from "mongoose";
import { IOption, IQuestion } from "./question.interface";

const optionSchema = new Schema<IOption>(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    selectedCount: { type: Number, default: 0 },
  },
  { _id: true },
);

const questionSchema = new Schema<IQuestion>(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: "Article",
      required: true,
    },
    topicIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Injury",
        required: true,
      },
    ],
    questionText: { type: String, required: true },
    options: { type: [optionSchema], required: true },
    explanation: { type: String, required: true },
    keyPoints: { type: [String], required: true, default: [] },
    marks: { type: Number, default: 1 },
    totalAttempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
  },
  { timestamps: true },
);
questionSchema.index({ articleId: 1, questionText: 1 }, { unique: true });
questionSchema.index({ articleId: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ isDeleted: 1 });
questionSchema.index({ isHidden: 1 });

// Middleware to prevent duplicate question text under same subtopic
questionSchema.pre("save", async function () {
  if (this.options.length < 2) {
    throw new Error("A question must have at least 2 options");
  }
  // 🔥 Duplicate option text check
  if (this.isModified("options")) {
    const optionTexts = this.options.map((opt) =>
      opt.text.toLowerCase().trim(),
    );
    const uniqueOptions = new Set(optionTexts);

    if (optionTexts.length !== uniqueOptions.size) {
      throw new Error("Duplicate options are not allowed in a question");
    }

    // ✅ Ensure only one correct answer
    const correctOptionsCount = this.options.filter(
      (opt) => opt.isCorrect === true,
    ).length;
    const falseOptionsCount = this.options.filter(
      (opt) => opt.isCorrect === false,
    ).length;

    if (correctOptionsCount > 1) {
      throw new Error("Only one option can be marked as correct in a question");
    }

    if (falseOptionsCount == this.options.length) {
      throw new Error(
        "At least one option must be marked as correct in a question",
      );
    }
  }
});

// Middleware for findOneAndUpdate
questionSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;
  const filter = this.getFilter() as any;

  const currentDoc = await QuestionModel.findOne(filter);
  if (!currentDoc) return;

  if (update.questionText) {
    const duplicate = await QuestionModel.findOne({
      articleId: update.articleId || currentDoc.articleId,
      questionText: update.questionText,
      _id: { $ne: currentDoc._id },
      isDeleted: false,
    });

    if (duplicate) {
      throw new Error(
        "A question with this text already exists under this subtopic",
      );
    }
  }

  const newOptions = update.options || update.$set?.options;

  if (newOptions && Array.isArray(newOptions)) {
    const optionTexts = newOptions.map((opt: any) =>
      opt.text.toLowerCase().trim(),
    );

    if (optionTexts.length !== new Set(optionTexts).size) {
      throw new Error("Duplicate options are not allowed in a question");
    }

    if (newOptions.length < 2) {
      throw new Error("A question must have at least 2 options");
    }

    const correctOptionsCount = newOptions.filter(
      (opt: any) => opt.isCorrect === true,
    ).length;

    if (correctOptionsCount > 1) {
      throw new Error("Only one option can be marked as correct in a question");
    }

    if (correctOptionsCount === 0) {
      throw new Error(
        "At least one option must be marked as correct in a question",
      );
    }
  }

  if (update.$set) {
    const isCorrectValue = update.$set["options.$.isCorrect"];
    const optionIdFromFilter = filter["options._id"];

    if (isCorrectValue === true) {
      const alreadyCorrect = currentDoc.options.some(
        (opt: any) =>
          opt.isCorrect === true &&
          opt._id.toString() !== optionIdFromFilter?.toString(),
      );
      if (alreadyCorrect) {
        throw new Error(
          "Only one option can be marked as correct in a question",
        );
      }
    }

    if (isCorrectValue === false) {
      const otherCorrectExists = currentDoc.options.some(
        (opt: any) =>
          opt.isCorrect === true &&
          opt._id.toString() !== optionIdFromFilter?.toString(),
      );
      if (!otherCorrectExists) {
        throw new Error(
          "At least one option must be marked as correct in a question",
        );
      }
    }
  }
});

export const QuestionModel = model<IQuestion>("Question", questionSchema);
