import { z } from "zod";

export const createLearningPlanSchema = z.object({
    name: z.string().optional().transform((val) => val?.trim()),
    description: z
        .string()
        .optional()
        .transform((val) => val?.trim()),
});

export const updateLearningPlanSchema = z.object({
    name: z
        .string()
        .optional()
        .transform((val) => val?.trim()),
    description: z
        .string()
        .optional()
        .transform((val) => val?.trim()),
});

export const addFlashcardSchema = z.object({
    flashcardId: z.string().min(1, "flashcardId is required"),
    isAnswered: z.enum(["unanswered", "incorrect", "unsure", "correct", "skipped"]).optional().default("unanswered"),
});

export const updateFlashcardProgressSchema = z.object({
    isAnswered: z.enum(["unanswered", "incorrect", "unsure", "correct", "skipped"]),
});

export const addArticleSchema = z.object({
    articleId: z.string().min(1, "articleId is required"),
    isRead: z.enum(["unread", "read", "skipped"]).optional().default("unread"),
});

export const updateArticleProgressSchema = z.object({
    isRead: z.enum(["unread", "read", "skipped"]),
});

export const addQuizSchema = z.object({
    primaryBodyRegion: z.string().min(1, "primaryBodyRegion is required"),
});

export const updateQuizProgressSchema = z.object({
    isAnswered: z.enum(["unanswered", "incorrect", "unsure", "correct", "skipped"]),
});
