import { Schema, model, CallbackError } from "mongoose";
import { IOption, IQuestion } from "./question.interface";

const optionSchema = new Schema<IOption>(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
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

// Middleware to prevent duplicate question text under same subtopic
questionSchema.pre("save", async function () {
  if (this.isNew || this.isModified("questionText")) {
    const duplicate = await QuestionModel.findOne({
      articleId: this.articleId,
      questionText: this.questionText,
      _id: { $ne: this._id },
      isDeleted: false,
    });

    if (duplicate) {
      throw new Error(
        "A question with this text already exists under this subtopic",
      );
    }
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

    if (correctOptionsCount > 1) {
      throw new Error("Only one option can be marked as correct in a question");
    }
  }
});

// Middleware for findOneAndUpdate
questionSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;
  const filter = this.getFilter() as any;

  const currentDoc = await QuestionModel.findOne(filter);
  if (!currentDoc) return;

  // 🔥 Question text duplicate check
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

  // 🔥 If full options array is being updated
  const newOptions = update.options || update.$set?.options;

  if (newOptions) {
    const optionTexts = newOptions.map((opt: any) =>
      opt.text.toLowerCase().trim(),
    );

    const uniqueOptions = new Set(optionTexts);

    if (optionTexts.length !== uniqueOptions.size) {
      throw new Error("Duplicate options are not allowed in a question");
    }

    const correctOptionsCount = newOptions.filter(
      (opt: any) => opt.isCorrect === true,
    ).length;

    if (correctOptionsCount > 1) {
      throw new Error("Only one option can be marked as correct in a question");
    }
  }

  // 🔥 If single option is being updated using positional operator
  if (update.$set) {
    const isSettingCorrect = Object.keys(update.$set).some((key) =>
      key.includes("isCorrect"),
    );

    if (isSettingCorrect && update.$set["options.$.isCorrect"] === true) {
      const alreadyCorrect = currentDoc.options.some(
        (opt: any) => opt.isCorrect === true,
      );

      if (alreadyCorrect) {
        throw new Error(
          "Only one option can be marked as correct in a question",
        );
      }
    }
  }
});

export const QuestionModel = model<IQuestion>("Question", questionSchema);
