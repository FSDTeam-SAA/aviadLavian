import { Types } from "mongoose";

export interface ILearningPlanFlashcard {
    flashcardId: Types.ObjectId;
    isAnswered: "unanswered" | "answered" | "skipped";
    answeredAt?: Date | null;
}

export interface ILearningPlanArticle {
    articleId: Types.ObjectId;
    isRead: "unread" | "read" | "skipped";
    readAt?: Date | null;
}

export interface ILearningPlan {
    userId: Types.ObjectId;
    name: string;
    description?: string;
    flashcards: ILearningPlanFlashcard[];
    articles: ILearningPlanArticle[];
    isActive: boolean;
}

export interface IGetAllLearningPlansParams {
    page?: string;
    limit?: string;
    sort?: "accending" | "decending";
    name?: string;
}
