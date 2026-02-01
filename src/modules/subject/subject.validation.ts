import { z } from "zod";

export const createSubjectSchema = z.object({
    title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(50, "Title must be at most 50 characters")
        .optional()
        .transform((val) => (val ? val.trim() : undefined)),

    description: z
        .string()
        .max(500, "Description must be at most 500 characters")
        .optional()
        .transform((val) => (val ? val.trim() : undefined)),
    status: z.string().optional()
});

export const updateSubjectSchema = z.object({
    title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(50, "Title must be at most 50 characters")
        .optional()
        .transform((val) => (val ? val.trim() : undefined)),
    description: z
        .string()
        .max(500, "Description must be at most 500 characters")
        .optional()
        .transform((val) => (val ? val.trim() : undefined)),
    status: z.string().optional()
});
