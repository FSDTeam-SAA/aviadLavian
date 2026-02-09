import { Schema, model, CallbackError } from "mongoose";
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

// Middleware to prevent duplicate question text under same subtopic
questionSchema.pre("save", async function () {
  if (this.isNew || this.isModified("questionText")) {
    const duplicate = await QuestionModel.findOne({
      subTopicId: this.subTopicId,
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

  // Check for duplicate options within the same question
  if (this.isModified("options")) {
    const optionTexts = this.options.map((opt) =>
      opt.text.toLowerCase().trim(),
    );
    const uniqueOptions = new Set(optionTexts);

    if (optionTexts.length !== uniqueOptions.size) {
      throw new Error("Duplicate options are not allowed in a question");
    }
  }
});

// Middleware for findOneAndUpdate
questionSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;

  // Check for duplicate question text if updating
  if (update.questionText) {
    const filter = this.getFilter() as any;
    const currentDoc = await QuestionModel.findOne(filter);

    if (currentDoc) {
      const duplicate = await QuestionModel.findOne({
        subTopicId: update.subTopicId || currentDoc.subTopicId,
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
  }

  // Check for duplicate options if updating options
  if (update.options || update.$set?.options) {
    const options = update.options || update.$set?.options;
    const optionTexts = options.map((opt: any) =>
      opt.text.toLowerCase().trim(),
    );
    const uniqueOptions = new Set(optionTexts);

    if (optionTexts.length !== uniqueOptions.size) {
      throw new Error("Duplicate options are not allowed in a question");
    }
  }
});

export const QuestionModel = model<IQuestion>("Question", questionSchema);
