import mongoose, { Schema } from "mongoose";
import { ILearningPlan } from "./learningplan.interface";

const learningPlanFlashcardSchema = new Schema(
    {
        flashcardId: {
            type: Schema.Types.ObjectId,
            ref: "Flashcard",
            required: true,
        },
        isAnswered: {
            type: String,
            enum: ["unanswered", "incorrect", "unsure", "correct", "skipped"],
            default: "unanswered",
        },
        answeredAt: {
            type: Date,
            default: null,
        },
    },
    { _id: true }
);

const learningPlanArticleSchema = new Schema(
    {
        articleId: {
            type: Schema.Types.ObjectId,
            ref: "Article",
            required: true,
        },
        isRead: {
            type: String,
            default: "unread",
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    { _id: true }
);

const learningPlanQuizSchema = new Schema(
    {
        quizId: {
            type: Schema.Types.ObjectId,
            ref: "Question",
            required: true,
        },
        isAnswered: {
            type: String,
            enum: ["unanswered", "incorrect", "unsure", "correct", "skipped"],
            default: "unanswered",
        },
        answeredAt: {
            type: Date,
            default: null,
        },
    },
    { _id: true }
);

const learningPlanSchema = new Schema<ILearningPlan>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        flashcards: {
            type: [learningPlanFlashcardSchema],
            default: [],
        },
        articles: {
            type: [learningPlanArticleSchema],
            default: [],
        },
        quizzes: {
            type: [learningPlanQuizSchema],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

learningPlanSchema.index({ userId: 1 });
learningPlanSchema.index({ name: "text" });

export const LearningPlanModel = mongoose.model<ILearningPlan>(
    "LearningPlan",
    learningPlanSchema
);
