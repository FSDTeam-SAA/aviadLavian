import { z } from "zod";

export const createFlashcardSchema = z.object({
  question: z
    .string()
    .min(3, "Question must be at least 3 characters")
    .max(100, "Question cannot exceed 100 characters")
    .transform((val) => val.trim()),

  answer: z
    .string()
    .min(3, "Answer must be at least 3 characters")
    .max(150, "Answer cannot exceed 150 characters")
    .transform((val) => val.trim()),

  topicId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId"),

  difficulty: z.enum(["easy", "medium", "hard"]),
}).strict();

export const updateFlashcardSchema = z.object({
  question: z
    .string()
    .min(3, "Question must be at least 3 characters")
    .max(100, "Question cannot exceed 100 characters")
    .transform((val) => val.trim())
    .optional(),

  answer: z
    .string()
    .min(3, "Answer must be at least 3 characters")
    .max(150, "Answer cannot exceed 150 characters")
    .transform((val) => val.trim())
    .optional(),

  difficulty: z.enum(["easy", "medium", "hard"]).optional()
})
  .strict()



