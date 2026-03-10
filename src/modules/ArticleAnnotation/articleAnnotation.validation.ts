import { z } from "zod";

const highlightZodSchema = z.object({
    id: z.string(),
    text: z.string(),
    range: z.any(),
    color: z.string().optional(),
});

const noteZodSchema = z.object({
    id: z.string(),
    content: z.string(),
});

const upsertAnnotationZodSchema = z.object({
    highlights: z.array(highlightZodSchema).optional(),
    notes: z.array(noteZodSchema).optional(),
});

export const articleAnnotationValidation = {
    upsertAnnotationZodSchema,
};
