import mongoose, { Schema } from "mongoose";
import { IArticle } from "./article.interface";

const articleSchema = new Schema<IArticle>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        topicIds: [
            {
                type: Schema.Types.Mixed,
                required: true,
            },
        ],
        description: {
            type: String, // Rich text (Tiptap) acceptable as string
            required: true,
        },
        image: {
            public_id: {
                type: String,
                required: false,
            },
            secure_url: {
                type: String,
                required: false,
            },
        },
        video: {
            public_id: {
                type: String,
                required: false,
            },
            secure_url: {
                type: String,
                required: false,
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Index for name for faster search
articleSchema.index({ name: "text" });

export const ArticleModel = mongoose.model<IArticle>("Article", articleSchema);
