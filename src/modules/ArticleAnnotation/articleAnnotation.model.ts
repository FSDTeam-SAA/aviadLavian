import mongoose, { Schema } from "mongoose";
import { IArticleAnnotation } from "./articleAnnotation.interface";

const highlightSchema = new Schema(
    {
        id: { type: String, required: true },
        text: { type: String, required: true },
        range: { type: Schema.Types.Mixed, required: true },
        color: { type: String },
    },
    { _id: false }
);

const noteSchema = new Schema(
    {
        id: { type: String, required: true },
        content: { type: String, required: true },
    },
    { _id: false }
);

const articleAnnotationSchema = new Schema<IArticleAnnotation>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        articleId: {
            type: Schema.Types.ObjectId,
            ref: "Article",
            required: true,
        },
        highlights: {
            type: [highlightSchema],
            default: [],
        },
        notes: {
            type: [noteSchema],
            default: [],
        },
    },
    { timestamps: true }
);

// One annotation document per user per article
articleAnnotationSchema.index({ userId: 1, articleId: 1 }, { unique: true });

export const ArticleAnnotationModel = mongoose.model<IArticleAnnotation>(
    "ArticleAnnotation",
    articleAnnotationSchema
);
